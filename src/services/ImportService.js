import { ApiService } from './ApiService';

export const ImportService = {
  // Vue appelle: ImportService.importData(selectedModule, csvData)
  async importData(module, rows) {
    try {
      const normalizedRows = Array.isArray(rows) ? rows : [];

      switch (module) {
        case 'products':
          return await this.importProduits(normalizedRows);
        case 'customers':
          return await this.importClientsEtCommandes(normalizedRows);
        case 'categories':
          return await this.importCategories(normalizedRows);
        case 'complex-customers':
          return await this.importClientsEtCommandes(normalizedRows, { complex: true });
        default:
          throw new Error(`Module ${module} non supporté`);
      }
    } catch (error) {
      console.error('Erreur import:', error);
      return {
        success: false,
        message: error.message || "Erreur lors de l'importation",
      };
    }
  },

  // Future API (non utilisée par l’UI actuelle)
  async importAll(files) {
    try {
      await this.importProduits(files?.produits || []);
      await this.importDetailsProduits(files?.details || []);
      await this.importClientsEtCommandes(files?.clients || []);
      await this.importImages(files?.images || []);
      return { success: true, message: 'Import terminé avec succès' };
    } catch (e) {
      return { success: false, message: e?.message || "Erreur lors de l'import" };
    }
  },

  async importProduits(rows) {
    const imported = await this.importProducts(rows);
    return {
      success: imported > 0,
      message: `${imported}/${rows.length} éléments importés avec succès`,
    };
  },

  async importDetailsProduits(_rows) {
    return { success: true, imported: 0 };
  },

  async importClientsEtCommandes(rows, { complex = false } = {}) {
    if (complex) {
      let success = 0;
      const importedEmails = new Set();

      for (const data of rows) {
        try {
          const res = await this.importComplexCustomer(data, importedEmails);
          if (res?.skipped) continue;
          success++;
        } catch (error) {
          console.error(`Erreur pour ${data?.email || data?.nom || 'client'}:`, error);
        }
      }

      return {
        success: success > 0,
        message: `${success}/${rows.length} éléments importés avec succès`,
      };
    }

    const imported = await this.importCustomers(rows);
    return {
      success: imported > 0,
      message: `${imported}/${rows.length} éléments importés avec succès`,
    };
  },

  async importImages(_files) {
    return { success: true, imported: 0 };
  },

  _xmlCdata(value) {
    const safe = value ?? '';
    return `<![CDATA[${String(safe)}]]>`;
  },

  _getTextByTag(xmlText, tagName) {
    if (!xmlText) return null;
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const el = xmlDoc.getElementsByTagName(tagName)?.[0];
      const t = el?.textContent;
      return t == null ? null : String(t).trim();
    } catch {
      return null;
    }
  },

  _buildCustomerXml({ lastname, email, passwd, firstname, active = 1, id_default_group = 3 }) {
    return `
      <prestashop>
        <customer>
          <firstname>${this._xmlCdata(firstname || '')}</firstname>
          <lastname>${this._xmlCdata(lastname || '')}</lastname>
          <email>${this._xmlCdata(email || '')}</email>
          <passwd>${this._xmlCdata(passwd || '')}</passwd>
          <active>${active}</active>
          <id_default_group>${id_default_group}</id_default_group>
        </customer>
      </prestashop>`;
  },

  _buildAddressXml({ id_customer, id_country = 1, alias, address1, postcode, city, phone, mobile, lastname, firstname }) {
    return `
      <prestashop>
        <address>
          <id_customer>${id_customer}</id_customer>
          <id_country>${id_country}</id_country>
          <alias>${this._xmlCdata(alias || '')}</alias>
          <lastname>${this._xmlCdata(lastname || '')}</lastname>
          <firstname>${this._xmlCdata(firstname || '')}</firstname>
          <address1>${this._xmlCdata(address1 || '')}</address1>
          <postcode>${this._xmlCdata(postcode || '')}</postcode>
          <city>${this._xmlCdata(city || '')}</city>
          <phone>${this._xmlCdata(phone || '')}</phone>
          <mobile>${this._xmlCdata(mobile || '')}</mobile>
        </address>
      </prestashop>`;
  },

  // products CSV attendu (produit.csv)
  // headers: date_availability_produit, nom, reference, prix_ttc, Taxe, categorie, prix_achat
  async importProducts(rows) {
    let success = 0;

    for (const data of rows) {
      const safe = typeof data === 'object' && data !== null ? data : {};

      const name = safe.name || safe.nom || '';
      const price = safe.price ?? safe.prix_ttc ?? safe.prix_achat ?? 0;

      const slug = name
        ? String(name)
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '')
        : 'product';

      const priceNum = (() => {
        const raw = price ?? 0;
        const s = String(raw).replace(/\s/g, '').replace(',', '.');
        const n = Number(s);
        return Number.isFinite(n) ? n : 0;
      })();

      const xml = `
        <prestashop>
          <product>
            <name><language id="1">${this._xmlCdata(name || '')}</language></name>
            <link_rewrite><language id="1">${this._xmlCdata(slug)}</language></link_rewrite>
            <price>${priceNum}</price>
            <active>1</active>
            <state>1</state>
            <id_category_default>2</id_category_default>
            <reference>demo_${Math.floor(Math.random() * 10000)}</reference>
          </product>
        </prestashop>`;

      const res = await ApiService.post('products', xml);
      if (res?.ok) success++;
    }

    return success;
  },

  // customers CSV attendu (client.csv)
  // headers: date, nom, email, pwd, adresse, achat, etat
  async importCustomers(rows) {
    let success = 0;

    for (const data of rows) {
      const safe = typeof data === 'object' && data !== null ? data : {};

      const lastname = safe.lastname || safe.nom || safe.name || '';
      // PrestaShop exige firstname non vide -> fallback sur lastname
      const firstname = safe.prenom || safe.firstname || lastname || 'Client';
      const email = safe.email || '';
      const passwd = safe.passwd || safe.pwd || safe.password || 'password123';

      const xml = `
        <prestashop>
          <customer>
            <firstname>${this._xmlCdata(firstname)}</firstname>
            <lastname>${this._xmlCdata(lastname)}</lastname>
            <email>${this._xmlCdata(email)}</email>
            <passwd>${this._xmlCdata(passwd)}</passwd>
            <active>1</active>
          </customer>
        </prestashop>`;

      const res = await ApiService.post('customers', xml);
      if (res?.ok) success++;
    }

    return success;
  },

  async importCategories(rows) {
    let success = 0;

    for (const data of rows) {
      const safe = typeof data === 'object' && data !== null ? data : {};
      const name = safe.name || safe.categorie || safe.nom || '';

      const slug = name ? String(name).toLowerCase().replace(/\s+/g, '-') : 'cat';

      const xml = `
        <prestashop>
          <category>
            <name><language id="1">${this._xmlCdata(name)}</language></name>
            <link_rewrite><language id="1">${this._xmlCdata(slug)}</language></link_rewrite>
            <active>1</active>
          </category>
        </prestashop>`;

      const res = await ApiService.post('categories', xml);
      if (res?.ok) success++;
    }

    return success;
  },

  async importComplexCustomer(data, importedEmails = new Set()) {
    // Normalise clés
    const safe = {};
    Object.keys(data || {}).forEach((key) => {
      const cleanKey = String(key).trim().toLowerCase().replace(/[^\w]/g, '');
      safe[cleanKey] = data[key];
    });

    const lastname = (safe.nom || safe.lastname || safe.name || 'Inconnu').trim();
    const firstname = (safe.prenom || safe.firstname || lastname || 'Client').trim();
    const email = (safe.email || '').trim();
    const passwd = safe.pwd || safe.passwd || 'password123';

    if (!lastname) {
      throw new Error('Lastname vide');
    }

    const customerXml = this._buildCustomerXml({
      lastname,
      firstname,
      email,
      passwd,
      active: 1,
      id_default_group: 3,
    });

    const customerRes = await ApiService.post('customers', customerXml);
    if (!customerRes?.ok) {
      console.error('Réponse PrestaShop (Client):', customerRes.text);
      throw new Error(`Erreur Client: ${customerRes.status}`);
    }

    const customerIdStr = this._getTextByTag(customerRes.text, 'id');
    const customerId = customerIdStr ? Number(customerIdStr) : null;
    if (!customerId) throw new Error('ID client introuvable dans la réponse.');

    // (Adresse non utilisée pour l’instant)
    return { customerId, addressCreated: true };
  },
};

