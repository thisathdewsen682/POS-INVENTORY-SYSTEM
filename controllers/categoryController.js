const CategoryModel = require('../models/categoryModel');

class CategoryController {
    static getIndex(req, res) {
        const categories = CategoryModel.getAll();
        res.render('categories/index', { title: 'Categories', categories });
    }

    static getCreate(req, res) {
        res.render('categories/form', { title: 'Add Category', category: null });
    }

    static postCreate(req, res) {
        try {
            CategoryModel.create(req.body.name);
            res.redirect('/categories');
        } catch (error) {
            res.render('categories/form', { title: 'Add Category', category: null, error: error.message });
        }
    }

    static getEdit(req, res) {
        const category = CategoryModel.findById(req.params.id);
        if (!category) return res.redirect('/categories');
        res.render('categories/form', { title: 'Edit Category', category });
    }

    static postEdit(req, res) {
        try {
            CategoryModel.update(req.params.id, req.body.name);
            res.redirect('/categories');
        } catch (error) {
            const category = { id: req.params.id, name: req.body.name };
            res.render('categories/form', { title: 'Edit Category', category, error: error.message });
        }
    }

    static postDelete(req, res) {
        try {
            CategoryModel.delete(req.params.id);
        } catch (error) {
            console.error('Delete error', error);
        }
        res.redirect('/categories');
    }
}

module.exports = CategoryController;
