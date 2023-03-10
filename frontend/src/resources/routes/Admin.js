require('dotenv').config();
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const fileapis = require('../middlewares/fileapis');
const API_URL = process.env.API_URL;
const { upload } = require('../middlewares/multer');


// [GET] Storage product /admin/storage-product
router.get('/storage-product', async (req, res, next) => {
    await fetch(API_URL + `products/storage` , {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        let products = data.map(d => {
            return {
                pid: d.product_ID,
                pname: d.product_name,
                pimg: d.image_link,
                category: d.product_category,
                price: d.product_price,
                priority: d.product_priority,
                is_available: d.is_available == 1
            }
        })

        
        return res.render('pages/products/storage', {
            layout: 'admin',
            success: req.flash('success') || '',
            error: req.flash('error') || '' ,
            products: products
        })
    })
    
})

// [GET] Create product -> /admin/create-product
router.get('/create-product', async (req, res, next) => {
    let categories = ['buffet', 'alacarte', 'extra'];

    return res.render('pages/products/create', {
        layout: 'admin',
        pageName: 'Thêm sản phẩm',
        categories,
        success: req.flash('success') || '',
        error: req.flash('error') || ''
    })
})

// [POST] Create product -> admin/create-product
router.post('/create-product', upload.single('pimg'), async (req, res, next) => {
    const file = req.file;
    const pid = req.pid;
    let pimg = `/uploads/pimg/${pid}/${file.filename}`;

    let body = JSON.stringify({pid, pimg, ...req.body});
    await fetch(API_URL + '/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: body
    })
    .then(async (result) => {
        let data = await result.json();
        req.flash('success', 'Thêm sản phẩm thành công');
        return res.redirect('/admin/storage-product');
    })
    .catch(err => {
        req.flash('error', 'Xóa sản phẩm thất bại');
        return res.redirect('/admin/storage-product');
    })
})


// [GET] Delete product -> /admin/delete-product/:pid
router.get('/delete-product/:pid', async (req, res, next) => {
    const { pid } = req.params;
    
    await fetch(API_URL + `/products/delete/${pid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json'},
    })
    .then(async (result) => {
        let data = await result.json();

        if(data.success) {
            req.flash('success', data.msg);
            fileapis.removeDirectory(`frontend/src/public/uploads/pimg/${pid}`, err => {
                console.log(err);
            })    
        }
        else {
            req.flash('error', 'Xóa sản phẩm thất bại');
        }
        return res.redirect('/admin/storage-product');
    })
    .catch(err => {
        req.flash('error', 'Xóa sản phẩm thất bại');
        return res.redirect('/admin/storage-product');
    })
})

// [GET] Update product -> admin/update-product/:pid
router.get('/update-product/:pid', async (req, res, next) => {
    const { pid } = req.params;
    let categories = ['buffet', 'alacarte', 'extra'];
    let data = await fetch(API_URL + `/products/getOne/${pid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(async result => {
        let data = await result.json();
        return {
            pid: data.product_ID,
            pname: data.product_name,
            pimg: data.image_link,
            category: data.product_category,
            price: data.product_price,
            priority: data.product_priority,
            is_available: data.is_available == 1
        };
    })

    return res.render('pages/products/update', {
        layout: 'admin',
        pageName: 'Chỉnh sửa sản phẩm',
        categories, data,
        success: req.flash('success') || '',
        error: req.flash('error') || ''
    })
})

// [POST] Update product -> /admin/update-product/:pid
router.post('/update-product/:pid', upload.single('pimg'), async (req, res, next) => {
    const { pid } = req.params;
    const file = req.file;
    let { oldpath } = req.body;
    let pimg = '';
    
    if(file) {
        pimg = `/uploads/pimg/${pid}/${file.filename}`;
        if(oldpath) {
            fileapis.deleteSync('frontend/src/public' + oldpath, err => [
                console.log(err)
            ])
        } 
    }
    else {
        pimg = oldpath;
    }

    let body = JSON.stringify({
        pid, pimg, ...req.body
    })
    
    await fetch(API_URL + `/products/update/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: body
    })
    .then(async result => {
        let data = await result.json();
        if(data.success) {
            req.flash('success', 'Chỉnh sửa sản phẩm thành công');
        }else {
            req.flash('error', 'Chỉnh sửa sản phẩm thất bại');
        }
        return res.redirect('/admin/storage-product');
        
    })
    .catch(err => {
        req.flash('error', 'Chỉnh sửa sản phẩm thất bại');
        return res.redirect('/admin/storage-product');
    })
})

// [GET] Preview product -> /admin/preview-product/:pid
router.get('/preview-product/:pid', async (req, res, next) => {
    const { pid } = req.params;

    await fetch(API_URL + `/products/getOne/${pid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(async result => {
        let data = await result.json();

        return res.render('pages/products/preview', {
            layout: 'admin',
            pageName: 'Preview sản phẩm',
            data: {
                pid: data.product_ID,
                pname: data.product_name,
                pimg: data.image_link,
                category: data.product_category,
                price: data.product_price,
                priority: data.product_priority,
            },
            success: req.flash('success') || '',
            error: req.flash('error') || ''
        })
    })
    .catch(err => {
        req.flash('error', 'Không tìm thấy thông tin sản phẩm này');
        return res.redirect('/admin/storage-product');
    })
})

// [PUT] Switch Status of product -> /admin/status-product/:pid
router.get('/status-product/:pid/:is_available', async (req, res, next) => {
    
    const { pid, is_available } = req.params;

    let body = JSON.stringify({is_available});
    await fetch(API_URL + `/products/switch-status/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json'},
        body: body
    })
    .then(async result => {
        result = await result.json();

        return res.redirect('/admin/storage-product');
    })
    .catch(err => {
        return res.redirect('/admin/storage-product');
    })
})

// [GET] Preview Staff -> /admin/preview-staff/:uid
router.get('/preview-staff/:uid', async (req, res, next) => {
    const { uid } = req.params;

    await fetch(API_URL + `/users/getUser/${uid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json'}
    })
    .then(async result => {
        result = await result.json();
        let data = {};
        if(result.success) {
            data = result.data;  
        }

        return res.render('pages/staffs/preview', {
            layout: 'admin',
            pageName: 'Thông tin nhân viên',
            data: {
                uid: data.staff_ID,
                username: data.staff_name,
                join_date: new Date(data.join_date).toLocaleString('vi-vn'),
                role: data.roles,
                uimg: data.image_link
            }
        })
    })
    .catch(err => {
        req.flash('error', 'Không tìm thấy thông tin nhân viên này');
        return res.redirect('/admin/list-staffs');
    })
})

// [GET] List all the staffs -> /admin/list-staffs
router.get('/list-staffs', async (req, res, next) => {
    await fetch(API_URL + '/users/getUsers', {
        method: 'GET', 
        headers: {'Content-Type': 'application/json'}
    })
    .then(async result => {
        result = await result.json();
        let data = []
        if(result.success) {
            data = result.data.map(user => {
                return {
                    uid: user.staff_ID,
                    username: user.staff_name,
                    join_date: new Date(user.join_date).toLocaleString('vi-vn'),
                    role: user.roles,
                    uimg: user.image_link,
                    is_available: user.is_available
                }
            });
        }

        return res.render('pages/staffs/list', {
            layout: 'admin',
            pageName: 'Danh sách nhân viên',
            data: data
        })
    })
    .catch(err => {
        req.flash('error', 'Không tìm thấy nhân viên nào');
        return res.redirect('/admin');
    })
})

// [GET] Switch status a staff -> /admin/status-staff/:pid/:is_available
router.get('/status-staff/:uid/:is_available', async (req, res, next) => {
    const { uid, is_available } = req.params;

    let body = JSON.stringify({is_available});
    await fetch(API_URL + `/users/switch-status/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json'},
        body: body
    })
    .then(async result => {
        result = await result.json();
        
        return res.redirect('/admin/list-staffs');
    })
    .catch(err => {
        return res.redirect('/admin/list-staffs');
    })
})

module.exports = router;