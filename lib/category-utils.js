'use strict';

function getCategoryFromPath(filePath, defaultCategory) {
    const normalized = String(filePath || '').replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length > 1) {
        return parts[0];
    }
    return defaultCategory || '';
}

function mapToExistingCategory(categoryName, categories, categoryMappings, reverseCategoryMappings) {
    if (!categoryName) return null;
    if (categories && categories[categoryName]) return categoryName;

    if (categoryMappings && categoryMappings[categoryName]) {
        const mapped = categoryMappings[categoryName];
        if (categories && categories[mapped]) return mapped;
    }

    if (reverseCategoryMappings && reverseCategoryMappings[categoryName]) {
        const reverse = reverseCategoryMappings[categoryName];
        if (categories && categories[reverse]) return reverse;
    }

    return null;
}

function resolveCategory(options) {
    const filePath = options ? options.filePath : '';
    const categories = options ? options.categories : null;
    const categoryMappings = options ? options.categoryMappings : null;
    const reverseCategoryMappings = options ? options.reverseCategoryMappings : null;
    const defaultCategory = options ? options.defaultCategory : '';

    const categoryFromPath = getCategoryFromPath(filePath, defaultCategory);
    const mapped = mapToExistingCategory(
        categoryFromPath,
        categories,
        categoryMappings,
        reverseCategoryMappings
    );
    return mapped || categoryFromPath;
}

module.exports = {
    getCategoryFromPath,
    mapToExistingCategory,
    resolveCategory
};
