import { ApiService } from './ApiService';

export const ImportService = {
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
      if (await ApiService.post('products', xml)) success++;
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
            <firstname>${data.firstname}</firstname>
            <lastname>${data.lastname}</lastname>
            <email>${data.email}</email>
            <passwd>password123</passwd>
            <active>1</active>
          </customer>
        </prestashop>`;
      if (await ApiService.post('customers', xml)) success++;
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
      if (await ApiService.post('categories', xml)) success++;
    }
    return success;
  }
};