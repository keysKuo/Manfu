const router = require('express').Router();
const db = require("../../config/db/database");
const { queryString } = require('../middlewares');
const { uuid } = require('uuidv4');
const { query } = require('express');

// [GET] All tables page -> /api/tables/get-tables
router.get("/get-tables", async (req, res, next) => {
    await db.Query(queryString("select",
        {
            select: "*",
            table: "__TABLE",
            optional: "order by table_ID desc"
        }))
        .then(data => {
            if (data.length != 0) {
                return res.status(200).json({
                    success: true,
                    message: "List all table",
                    data: data
                })
            }
            else {
                return res.status(404).json({
                    success: true,
                    message: "List is empty"
                })
            }
        })
        .catch(err => {
            return res.status(500).json({
                success: false,
                message: err
            })
        })
})


// [GET] All tables page based on status -> /api/tables/get-tables/:status
router.get("/get-tables/:status", async (req, res, next) => {
    const { status } = req.params
    let is_available = 1
    if (status == 'available') {
        is_available = 1
    }
    else if (status == 'unavailable') {
        is_available = 0
    }
    else {
        return res.status(500).json({
            success: false,
            message: "Invalid status input"
        })
    }
    await db.Query(queryString("select",
        {
            select: "*",
            table: "__TABLE",
            optional: `where is_available = ${is_available} order by table_ID desc`
        }))
        .then(data => {
            if (data.length != 0) {
                return res.status(200).json({
                    success: true,
                    message: `List all ${status} table(s)`,
                    data: data
                })
            }
            else {
                return res.status(404).json({
                    success: true,
                    message: "List is empty"
                })
            }
        })
        .catch(err => {
            return res.status(500).json({
                success: false,
                message: err
            })
        })
})


// [GET] Table page by ID -> /api/tables/get-table/:tid
router.get('/get-table/:tid', async (req, res, next) => {
    const { tid } = req.params;
    await db.Query(queryString("select",
        {
            select: "*",
            table: "__TABLE",
            optional: `where table_ID = '${tid}' `
        }))
        .then(data => {
            if (data.length != 0) {
                return res.status(200).json(
                    {
                        success: true,
                        message: `Content of table ${tid}`,
                        data: data
                    }
                )
            }
            else {
                return res.status(500).json(
                    {
                        success: false,
                        message: 'No content'
                    }
                )
            }
        })
        .catch(err => {
            return res.status(404).json(
                {
                    success: false,
                    message: err
                }
            )
        })
});


// [POST] Create table page -> /api/tables/create
router.post('/create', async (req, res, next) => {
    const { table_ID, table_seat, is_available } = req.body;
    let available = (is_available == true) ? 1 : 0;
    let is_exist = await db.Query(queryString('select', {
        select: 'table_ID',
        table: '__TABLE',
        where: `table_ID = '${table_ID}'`
    }))

    if (is_exist.length != 0) {
        return res.status(500).json(
            {
                success: false,
                msg: 'B??n n??y ???? t???n t???i'
            }
        );
    }

    await db.Execute(queryString('insert', {
        table: '__TABLE',
        values: `'${table_ID}' , ${table_seat}, ${available}, null`
    }))
        .then(() => {
            return res.status(200).json({
                success: true,
                msg: "Add table successfully",
                table: { ...req.body }
            })
        })
        .catch(err => {
            return res.status(500).json({
                message: err
            });
        })
})


// [DELETE] Delete table page -> /api/tables/delete/:tid
router.delete('/delete/:tid', async (req, res, next) => {
    const { tid } = req.params

    await db.Query(queryString("select", {
        select: "*",
        table: "__TABLE",
        optional: `where table_ID = '${tid}'`
    }))
        .then(async data => {
            if (data.length != 0) {
                await db.Execute(queryString("delete", {
                    table: "__TABLE",
                    where: `table_ID = '${tid}'`
                }))
                    .then(() => {
                        return res.status(200).json({
                            success: true,
                            message: `Delete table ${tid} successfully`
                        })
                    })
                    .catch(err => {
                        return res.status(500).json({
                            success: false,
                            message: err
                        })
                    })
            }
            else {
                return res.status(404).json({
                    success: false,
                    message: `Can not find value ${tid}`
                })
            }
        })
        .catch(err => {
            return res.status(500).json({
                success: false,
                type: "error",
                message: err
            })
        })
})



// [PUT] Update table page -> /api/tables/update/:tid
router.put('/update/:tid', async (req, res, next) => {
    const { tid } = req.params;
    const { table_seat, is_available, staff_ID } = req.body;
    let available = (is_available == true) ? 1 : 0

    await db.Execute(queryString('update', {
        table: '__TABLE',
        set: `table_seat = '${table_seat}', is_available = ${available}, staff_id = '${staff_ID}'`,
        where: `table_ID = '${tid}'`
    }))
        .then(() => {
            return res.status(200).json({
                success: true,
                msg: 'Update table successfully'
            });
        })
        .catch(err => {
            return res.status(500).json({
                success: false,
                msg: err
            });
        })
});


// [PUT] Switch is_availavle status table page -> /api/tables/switch-available-status/:tid
// switch status = check the emp ID
router.put('/switch-available-status/:tid', async (req, res, next) => {
    const { tid } = req.params
    const { staff_ID, is_available } = req.body
    let available = (is_available == true) ? 1 : 0;

    if (staff_ID) {
        await db.Query(queryString("select", {
            select: "*",
            table: "__STAFF",
            optional: `where staff_ID = '${staff_ID}'`
        }))
            .then(async data => {
                if (data.length != 0) {
                    await db.Query(queryString("update", {
                        table: "__TABLE",
                        set: `is_available = ${available}, staff_ID = '${staff_ID}'`,
                        where: `table_ID = '${tid}'`
                    }))
                        .then(() => {
                            return res.status(200).json({
                                success: true,
                                message: `Success change availability ${tid}`,
                                is_available: available
                            })
                        })
                        .catch(err => {
                            return res.status(500).json({
                                success: false,
                                message: err
                            })
                        })
                }
                else {
                    return res.status(404).json({
                        success: false,
                        message: `There is no staff ID with value ${staff_ID}`
                    })
                }
            })
            .catch(err => {
                return res.status(404).json({
                    success: false,
                    message: err
                })
            })
    }
    else {
        return res.status(404).json({
            success: false,
            message: "There is no staff ID to make change"
        })
    }
})


module.exports = router;