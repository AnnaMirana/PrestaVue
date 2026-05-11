import { ApiService } from './ApiService';

export const ImportService = {
  // --- Fonctions privées (Clean Code) ---
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

  // MODULE PRODUITS
  async importProducts(rows) {
    let success = 0;
    for (const data of rows) {
      const slug = data.name ? data.name.toLowerCase().replace(/\s+/g, '-') : 'product';
      const xml = `
        <prestashop>
          <product>
            <name><language id="1">${data.name}</language></name>
            <link_rewrite><language id="1">${slug}</language></link_rewrite>
            <price>${data.price || 0}</price>
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

  // MODULE CLIENTS
  async importCustomers(rows) {
    let success = 0;
    for (const data of rows) {
      const xml = `
        <prestashop>
          <customer>
            <firstname>${data.firstname || ''}</firstname>
            <lastname>${data.lastname || ''}</lastname>
            <email>${data.email || ''}</email>
            <passwd>${data.passwd || 'password123'}</passwd>
            <active>1</active>
          </customer>
        </prestashop>`;
      const res = await ApiService.post('customers', xml);
      if (res?.ok) success++;
    }
    return success;
  },

  // MODULE CATÉGORIES
  async importCategories(rows) {
    let success = 0;
    for (const data of rows) {
      const slug = data.name ? data.name.toLowerCase().replace(/\s+/g, '-') : 'cat';
      const xml = `
        <prestashop>
          <category>
            <name><language id="1">${data.name}</language></name>
            <link_rewrite><language id="1">${slug}</language></link_rewrite>
            <active>1</active>
          </category>
        </prestashop>`;

      const res = await ApiService.post('categories', xml);
      if (res?.ok) success++;
    }
    return success;
  },

  // --- Objectif : Client + Adresse (relation Parent-Enfant) ---
  async importComplexCustomer(data, importedEmails = new Set()) {

    // 1. Normalisation et Protection (Props validation)
    const lastname = (data?.nom || data?.lastname || 'Client').trim();
    const firstname = (data?.prenom || data?.firstname || ' ').trim();
    const email = data?.email?.trim() || '';
    const passwd = data?.pwd || data?.passwd || '';

    // Champs Adresse (normalisation stricte : pas de vide)
    const address1 = (data?.adresse || data?.address1 || 'Non précisée').trim() || 'Non précisée';
    const city = (data?.city || 'Antananarivo').trim() || 'Antananarivo';
    const postcode = (data?.postcode ?? '101').toString().trim() || '101';

    // alias doit être non vide
    const alias = (data?.alias ?? 'Mon Adresse').toString().trim() || 'Mon Adresse';



    if (!email || passwd.length < 8) {
      throw new Error('Champs invalides : Email manquant ou Mot de passe < 8 caractères.');
    }

    // Anti-doublon (dans une même session) : évite d'importer 2 fois le même email
    if (importedEmails.has(email)) {
      return { customerId: null, addressCreated: false, skipped: true };
    }
    importedEmails.add(email);

    // Étape 1 : Création du client

    const customerXml = this._buildCustomerXml({
      lastname,
      firstname,
      email,
      passwd,
      active: 1,
      id_default_group: 3
    });

    const customerRes = await ApiService.post('customers', customerXml);

    if (!customerRes?.ok) {
      // On log le texte pour voir si c'est un problème d'email déjà utilisé
      console.error("Réponse PrestaShop (Client):", customerRes.text);
      throw new Error(`Erreur Client: ${customerRes.status}`);
    }

    // Extraction robuste de l'ID
    const customerIdStr = this._getTextByTag(customerRes.text, 'id');
    const customerId = customerIdStr ? Number(customerIdStr) : null;

    if (!customerId) {
      throw new Error('ID client introuvable dans la réponse.');
    }

    // Étape 2 : Création de l'adresse liée
    const addressXml = this._buildAddressXml({
      id_customer: customerId,
      id_country: data?.id_country || 1, 
      alias: alias, // Toujours remplir l'alias
      address1,
      city,
      postcode,
      lastname,
      firstname
    });

    const addressRes = await ApiService.post('addresses', addressXml);

    if (!addressRes?.ok) {
      console.error("Réponse PrestaShop (Adresse):", addressRes?.text);
      throw new Error(`Erreur Adresse: ${addressRes?.status}`);
    }


    return { customerId, addressCreated: true };
  }
};
