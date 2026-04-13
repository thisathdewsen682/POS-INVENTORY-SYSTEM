const ProductModel = require('../models/productModel');
const CategoryModel = require('../models/categoryModel');

class ProductController {
    static getIndex(req, res) {
        const products = ProductModel.getAll();
        res.render('products/index', { title: 'Products', products });
    }

    static getCreate(req, res) {
        const categories = CategoryModel.getAll();
        res.render('products/form', { title: 'Add Product', product: null, categories });
    }

    static postCreate(req, res) {
        try {
            ProductModel.create(req.body);
            res.redirect('/products');
        } catch (error) {
            const categories = CategoryModel.getAll();
            res.render('products/form', { title: 'Add Product', product: req.body, categories, error: error.message });
        }
    }

    static getEdit(req, res) {
        const product = ProductModel.findById(req.params.id);
        if (!product) return res.redirect('/products');
        const categories = CategoryModel.getAll();
        res.render('products/form', { title: 'Edit Product', product, categories });
    }

    static postEdit(req, res) {
        try {
            ProductModel.update(req.params.id, req.body);
            res.redirect('/products');
        } catch (error) {
            const categories = CategoryModel.getAll();
            const product = { ...req.body, id: req.params.id };
            res.render('products/form', { title: 'Edit Product', product, categories, error: error.message });
        }
    }

    static postDelete(req, res) {
        try {
            ProductModel.delete(req.params.id);
        } catch (error) {
            console.error(error);
        }
        res.redirect('/products');
    }
}

module.exports = ProductController;
