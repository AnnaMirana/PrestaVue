// Ce fichier contient uniquement les "moules" XML pour chaque module
export const XmlMappers = {
    
    // TRADUCTEUR POUR LES PRODUITS
    products: (data) => `
        <prestashop>
            <product>
                <name><language id="1">${data.name}</language></name>
                <price>${data.price}</price>
                <active>1</active>
                <reference>demo_${Math.floor(Math.random() * 1000)}</reference>
            </product>
        </prestashop>`,

    // TRADUCTEUR POUR LES CLIENTS
    customers: (data) => `
        <prestashop>
            <customer>
                <firstname>${data.firstname}</firstname>
                <lastname>${data.lastname}</lastname>
                <email>${data.email}</email>
                <passwd>password123</passwd>
            </customer>
        </prestashop>`,

    // TRADUCTEUR POUR LES CATEGORIES
    categories: (data) => `
        <prestashop>
            <category>
                <name><language id="1">${data.name}</language></name>
                <active>1</active>
            </category>
        </prestashop>`,
    
    // Et ainsi de suite pour les 15 modules...
};