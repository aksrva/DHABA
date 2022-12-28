const express = require("express");
const app = express();
const session = require("express-session");
const hbs = require("hbs");
const body_parser = require("body-parser");
const schemas = require("./schema");
const path = require("path");
const multer = require('multer');
const PORT = process.env.PORT || 8921;
const abs_path = path.join(__dirname, "../public");
app.set("view engine", "hbs");
app.use(body_parser.urlencoded({
    extended: true
}));
let img = "";
app.use(session({
    secret: "DHABA",
    saveUninitialized: true,
    cookie: { maxAge: 86400000 },
    resave: false
}));
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "public/images/");
        },
        filename: function (req, file, cb) {
            img = Date.now() + "_" + file.originalname;
            cb(null, img);
        }
    })
}).single("file_image");
hbs.registerPartials(abs_path + "/partials")
app.use(express.static(abs_path));
let error = "";
app.get("/", (req, res) => {
    try {
        let shops = [];
        schemas.user_model.find({}, (err, data) => {
            if (err) {
                console.log("errr");
            } else {
                for (let obj of data) {
                    let x = {};
                    x.shop_name = obj.admin_shop_name;
                    x.image = obj.admin_image;
                    shops.push(x);
                }
            }
        })
        res.render("index", { homepage: true, shops,biller_name: req.session.biller_name, biller_image: req.session.biller_image,admin_name: req.session.name, admin_image: req.session.admin_image });
    } catch (err) {
        res.redirect("/");
    }
});
app.get("/dhaba", (req, res) => {
    let products = [];
    schemas.user_model.find({ admin_shop_name: req.query.db }, (err, data) => {
        if (err) {
            console.log("err")
            res.redirect("/shop");
        } else {
            if (data.length > 0) {
                schemas.product.find({ administrator: data[0]._id }, (err, data) => {
                    if (err) {
                        console.log("err");
                        res.redirect("/not-found");
                    } else {
                        // let x = {};
                        if (data.length > 0) {
                            let i = 0;
                            for (let item of data) {
                                products.push({ product_name: item.item_name, product_image: item.item_image, half_price: item.half_plate_price, full_price: item.full_plate_price });
                            }
                        } else {
                            res.redirect("*");
                        }
                    }
                });
                res.render("index", { menu: true, products })
            } else {
                res.redirect("/not-found");
            }
        }
    });
});

app.get("/login", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    res.render("index", { isLogin: true, error });
});
app.post("/logged", (req, res) => {
    let user = {
        email_id: req.body.email_id,
        password: req.body.password,
        user_type: req.body.user_type
    }
    if (user.user_type === "admin") {
        schemas.user_model.find({ admin_email_id: user.email_id }, (err, result) => {
            if (err) {
                console.log(err);
                req.session.err_succss = "Some issued found!";
                res.redirect("/login");
            } else {
                if (result.length > 0) {
                    if (result[0].admin_password === user.password) {
                        req.session.name = result[0].admin_name;
                        req.session.admin_id = result[0]._id.toString();
                        req.session.admin_image = result[0].admin_image;
                        req.session.err_succss = "Welcome Back, " + req.session.name;
                        res.redirect("/admin");
                    } else {
                        req.session.err_succss = "Please provide valid information!";
                        res.redirect("/login");
                    }
                } else {
                    req.session.err_succss = "Incredential information";
                    res.redirect("/login");
                }
            }
        })
    } else if (user.user_type === "biller") {
        schemas.biller.find({ counter_email_id: user.email_id }, (err, result) => {
            if (err) {
                req.session.err_succss = "Some issued found!";
                res.redirect("/login");
            } else {
                if(result.length > 0){
                    if (result[0].counter_password === user.password) {
                        req.session.biller_name = result[0].counter_billing_name;
                        req.session.biller_image = result[0].biller_image;
                        req.session.biller_id = result[0]._id.toString();
                        req.session.admin_id = result[0].counter_admin;
                        res.redirect("/biller");
    
                    } else {
                        req.session.err_succss = "Provide valid information!";
                        res.redirect("/login");
                    }
                }else{
                    req.session.err_succss = "Please contact your admin now!";
                    res.redirect("/login");
                }
            }
        })
    }
    else {
        req.session.err_succss = "Please Create your account!";
        res.redirect("/signup");
    }
});
app.get("/signup", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    res.render("index", { isSignup: true, error });
});
app.post("/signup", upload, (req, res) => {
    let users = {
        admin_name: req.body.username,
        email_id: req.body.email_id,
        mobileno: req.body.mobileno,
        shop_name: req.body.shop_name,
        shop_location: req.body.shop_location,
        password: req.body.password,
        re_password: req.body.re_password,
    }
    if (users.password === users.re_password) {
        let newUser = new schemas.user_model(
            {
                admin_name: users.admin_name,
                admin_contact: users.mobileno,
                admin_email_id: users.email_id,
                admin_password: users.password,
                admin_shop_name: users.shop_name,
                admin_location: users.shop_location,
                admin_image: img
            }
        );
        try {
            newUser.save((err, resp) => {
                if (err) {
                    req.session.err_succss = "Some issues found, Please try again";
                    res.redirect("signup")
                } else {
                    req.session.err_succss = "You account is created!";
                    res.redirect("login");
                }
            })
        } catch (err) {
            req.session.err_succss = "Your account is not created please provide valid information";
            res.redirect("signup")
        }
    } else {
        req.session.err_succss = "Password & confirm password not matched";
        res.redirect("signup")
    }
})
app.get("/admin", (req, res) => {
    if (req.session.name) {
        schemas.product.find({ administrator: req.session.admin_id }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                let j = 1;
                for (let obj of result) {
                    obj.__v = j;
                    j = j + 1;
                }
                error = req.session.err_succss;
                delete req.session.err_succss;
                res.render("index", { admin: true, items: result, admin_name: req.session.name, admin_image: req.session.admin_image, error });
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/add-items", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        res.render("index.hbs", { add_item: true, admin_name: req.session.name, admin_image: req.session.admin_image, error });
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.post("/admin/items-upload", upload, (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        let product_info = {
            product_name: req.body.product_name,
            half_plate_price: req.body.half_plate,
            full_plate_price: req.body.full_plate
        }
        let product = new schemas.product({
            item_name: product_info.product_name,
            half_plate_price: product_info.half_plate_price,
            full_plate_price: product_info.full_plate_price,
            item_image: img,
            available: true,
            administrator: req.session.admin_id,
        });
        product.save((err, resp) => {
            if (err) {
                req.session.err_succss = "Product not saved!";
                res.redirect("/admin/add-items");
            } else {
                req.session.err_succss = "Product is successfully saved";
                res.redirect("/admin");
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/edit", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        if (req.query.item) {
            schemas.product.find({ _id: req.query.item }, (err, result) => {
                if (err) {
                    req.session.err_succss = "Some issued found!";
                    res.redirect("/admin");
                } else {
                    if (result.length > 0) {
                        res.render("index.hbs", { admin_name: req.session.name, admin_image: req.session.admin_image, edit_form: true, id: req.query.item, item_name: result[0].item_name, half_plate_price: result[0].half_plate_price, full_plate_price: result[0].full_plate_price, admin_login: true });
                    } else {
                        req.session.err_succss = "Data is not found!";
                        res.redirect("/admin");
                    }
                }
            })
        } else {
            req.session.err_succss = "Data is not updated, some issued found!";
            res.redirect("/admin");
        }
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/delete", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        if (req.query.item) {
            let id = req.query.item;
            schemas.product.findByIdAndDelete(id).exec((err, data) => {
                if (err) {
                    req.session.err_succss = "Some issued found in deletion";
                    res.redirect("/admin");
                } else {
                    req.session.err_succss = "Data Deleted Successfully!";
                    res.redirect("/admin");
                }
            })
        } else {
            req.session.err_succss = "Data is not Exists";
            res.redirect("/admin");
        }
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.post("/admin/items-update", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        let product_info = {
            product_id: req.body.product_id,
            product_name: req.body.product_name,
            half_plate_price: req.body.half_plate,
            full_plate_price: req.body.full_plate
        }
        schemas.product.updateOne({ _id: product_info.product_id },
            {
                $set: {
                    item_name: product_info.product_name,
                    half_plate_price: product_info.half_plate_price,
                    full_plate_price: product_info.full_plate_price,
                }
            }, (err, comp) => {
                if (err) {
                    req.session.err_succss = "Data is not updated";
                    res.redirect("/admin/edit");
                } else {
                    req.session.err_succss = "Data is Successfully Updated";
                    res.redirect("/admin");
                }
            })
        } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/act", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        schemas.product.updateOne({ _id: req.query.item }, {
            $set: {
                available: true
            }
        }, (err, data) => {
            if (err) {
                req.session.err_succss = "Not activated!";
                res.redirect("/admin");
            } else {
                req.session.err_succss = "Successfully Activated!";
                res.redirect("/admin");
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/dect", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        schemas.product.updateOne({ _id: req.query.item }, {
            $set: {
                available: false
            }
        }, (err, data) => {
            if (err) {
                req.session.err_succss = "Not Deactivated!";
                res.redirect("/admin");
            } else {
                req.session.err_succss = "Deactivated Successfully";
                res.redirect("/admin");
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/add-biller", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        res.render("index", { biller_add: true, admin_image: req.session.admin_image, admin_name: req.session.name, error})
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login")
    }
});
app.post("/admin/add-biller", upload, (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        let bill_er = {
            biller_name: req.body.biller_name,
            biller_email: req.body.biller_email,
            biller_contact: req.body.biller_contact,
            biller_address: req.body.biller_address,
            biller_password: req.body.biller_password,
        }
        let biller_user = new schemas.biller({
            counter_billing_name: bill_er.biller_name,
            counter_billing_contact: bill_er.biller_contact,
            counter_billing_address: bill_er.biller_address,
            counter_email_id: bill_er.biller_email,
            counter_password: bill_er.biller_password,
            biller_image: img,
            available: true,
            counter_admin: req.session.admin_id
        })
        biller_user.save((err, result) => {
            if (err) {
                req.session.err_succss = "Data is not inserted!";
                res.redirect("/admin");
            } else {
                req.session.err_succss = "Data is successfully inserted";
                res.redirect("/admin/biller");
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
})
app.get("/admin/biller", (req, res) => {
    if (req.session.name) {
        let admin = req.session.admin_id;
        schemas.biller.find({ counter_admin: admin }, (err, result) => {
            if (err) {
                req.session.err_succss = "Some issued found!";
                res.redirect("/admin");
            } else {
                let j = 1;
                for (let obj of result) {
                    obj.__v = j;
                    j = j + 1;
                }
                error = req.session.err_succss;
                delete req.session.err_succss;
                res.render("index", { admin_name: req.session.name, admin_image: req.session.admin_image, admin_biller: true, items: result, admin_name: req.session.name, error });
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/biller-delete", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        if (req.query.biller) {
            let id = req.query.biller;
            schemas.biller.findByIdAndDelete(id).exec((err, data) => {
                if (err) {
                    req.session.err_succss = "Some issued found!";
                    res.redirect("/admin/biller");
                } else {
                    req.session.err_succss = "Deleted Succesffully!";
                    res.redirect("/admin/biller");
                }
            })
        } else {
            req.session.err_succss = "Data is not Exists!";
            res.redirect("/admin/biller");
        }
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/biller-act", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        schemas.biller.updateOne({ _id: req.query.biller }, {
            $set: {
                available: true
            }
        }, (err, data) => {
            if (err) {
                req.session.err_succss = "Biller not activated";
                res.redirect("/admin/biller");
            } else {
                req.session.err_succss = "Biller Activated";
                res.redirect("/admin/biller");
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/biller-dect", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        schemas.biller.updateOne({ _id: req.query.biller }, {
            $set: {
                available: false
            }
        }, (err, data) => {
            if (err) {
                req.session.err_succss = "Not Deactivated";
                res.redirect("/admin/biller");
            } else {
                req.session.err_succss = "Deactivated Successfully";
                res.redirect("/admin/biller");
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/biller-edit", (req, res) => {
    if (req.session.name) {
        if (req.query.biller) {
            schemas.biller.find({ _id: req.query.biller }, (err, result) => {
                if (err) {
                    req.session.err_succss = "Some issued found!";
                    res.redirect("/admin");
                } else {
                    error = req.session.err_succss;
                    delete req.session.err_succss;
                    res.render("index.hbs", { admin_image: req.session.admin_image, admin_name: req.session.name, biller_edit: true, id: req.query.biller, biller_name: result[0].counter_billing_name, biller_contact: result[0].counter_billing_contact, biller_address: result[0].counter_billing_address, biller_email: result[0].counter_email_id, error });
                }
            })
        } else {
            req.session.err_succss = "Data is not Exists";
            res.redirect("/admin");
        }
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.post("/admin/biller-update", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.name) {
        schemas.biller.updateOne({ _id: req.body.biller_id }, {
            $set: {
                counter_billing_name: req.body.biller_name,
                counter_billing_contact: req.body.biller_contact,
                counter_billing_address: req.body.biller_address,
                counter_email_id: req.body.biller_email_id
            }
        }, (err, data) => {
            if (err) {
                req.session.err_succss = "Some issued Found!";
                res.redirect("/admin/biller")
            } else {
                req.session.err_succss = "Data is successfully updated!";
                res.redirect("/admin/biller")
            }
        });
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/customers", (req, res) => {
    if (req.session.name) {
        schemas.customer.find({ shop_admin: req.session.admin_id }, (err, data) => {
            if (err) {
                req.session.err_succss = "Some issued found!";
                res.redirect("/admin/customers");
            } else {
                let j = 1;
                for (let obj of data) {
                    obj.__v = j;
                    j = j + 1;
                }
                error = req.session.err_succss;
                delete req.session.err_succss;
                res.render("index", { admin_image: req.session.admin_image, admin_name: req.session.name, admin_customer: true, customers: data });
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/admin/orders", (req, res) => {
    if (req.session.name) {
        schemas.customer.find({ customer_mobile: req.query.cid, shop_admin: req.session.admin_id }, (err, data) => {
            if (err) {
                req.session.err_succss = "Some issued found!";
                res.redirect("admin/customers");
            } else {
                let j = 1;
                for (let i of data[0].orders) {
                    schemas.product.find({ _id: i.menu_id }, (err, data) => {
                        if (err) {
                            req.session.err_succss = "Some issued found!";
                            res.redirect("/admin/orders");
                        } else {
                            i.menu_id = data[0].item_name;
                        }
                    })
                    i.ind = j;
                    j = j + 1;
                }
                error = req.session.err_succss;
                delete req.session.err_succss;
                res.render("index", { admin_image: req.session.admin_image, admin_name: req.session.name, c_order: true, orders: data[0].orders, error });
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/biller", (req, res) => {
    if (req.session.biller_name) {
        schemas.product.find({ administrator: req.session.admin_id, available: true }, (err, result) => {
            if (err) {
                req.session.err_succss = "Some issued found!";
                res.redirect("/biller");
            } else {
                let j = 1;
                for (let obj of result) {
                    obj.__v = j;
                    j = j + 1;
                }
                error = req.session.err_succss;
                delete req.session.err_succss;
                res.render("index.hbs", { biller: true, biller_name: req.session.biller_name, biller_image: req.session.biller_image, items: result , error});
            }
        });
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/biller/make-bill", (req, res) => {
    if (req.session.biller_name) {
        error = req.session.err_succss;
        delete req.session.err_succss;
        res.render("index", { make_bill: true, p_id: req.query.pr, biller_name: req.session.biller_name, biller_image: req.session.biller_image, error});
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
    
})
app.post("/biller/make-bill", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.biller_name) {
        let customer_number = req.body.customer_contact;
        schemas.customer.find({ customer_mobile: customer_number, shop_admin: req.session.admin_id }, (err, result) => {
            if (err) {
                req.session.err_succss = "Some issued found!";
                res.redirect("/biller");
            } else {
                if (result.length === 0) {
                    req.session.err_succss = "Welcome Sir/Mam!";
                    res.redirect("bill?pr=" + req.body.product_id + "&mobile=" + customer_number + "&qty=" + req.body.qty + "&type=" + req.body.plate_type);
                } else {
                    req.session.err_succss = "Welcome back, to our store!";
                    res.redirect("bill?pr=" + req.body.product_id + "&name=" + result[0].customer_name + "&mobile=" + result[0].customer_mobile + "&qty=" + req.body.qty + "&type=" + req.body.plate_type);
                }
            }
        });
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/biller/bill", (req, res) => {
    
    if (req.session.biller_name) {
        let customer_name = "";
        let customer_mobile = "";
        let readonly = "";
        if (req.query.mobile) {
            customer_name = req.query.name;
            customer_mobile = req.query.mobile;
            readonly = "readonly";
        }
        schemas.product.find({ _id: req.query.pr }, (err, data) => {
            if (err) {
                console.log("Error");
                req.session.err_succss = "Some issued found!";
                req.redirect("biller");
            } else {
                let price = "";
                let total_payment = "";
                if (req.query.type === "half plate") {
                    price = data[0].half_plate_price;
                    total_payment = price * req.query.qty;
                } else if (req.query.type === "full plate") {
                    price = data[0].full_plate_price;
                    total_payment = price * req.query.qty;
                }
                error = req.session.err_succss;
                delete req.session.err_succss;
                res.render("index", { org_bill: true, customer_name, customer_mobile, qty: req.query.qty, pr_id: req.query.pr, readonly, total_price: total_payment, price_per_qty: price, type: req.query.type, biller_name: req.session.biller_name, biller_image: req.session.biller_image,error });
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.post("/biller/bill", (req, res) => {
    error = req.session.err_succss;
    delete req.session.err_succss;
    if (req.session.biller_name) {
        let date = new Date();
        let new_customer = new schemas.customer({
            customer_name: req.body.customer_name,
            customer_mobile: req.body.customer_contact,
            orders: [
                {
                    menu_id: req.body.menu_id,
                    order_date: date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear(),
                    order_time: date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
                    quantity: req.body.qty,
                    order_plate_type: req.body.plate_type,
                    order_price_per_quantity: req.body.item_price,
                    order_total_payment: req.body.total_amount,
                    biller_name: req.session.biller_name
                }
            ],
            shop_admin: req.session.admin_id
        });
        schemas.customer.find({ customer_mobile: req.body.customer_contact, shop_admin: req.session.admin_id }, (err, result) => {
            if (err) {
                req.session.err_succss = "Some Issued found! Please try again later";
                res.redirect("biller");
            } else {
                if (result.length === 0) {
                    new_customer.save((err, data) => {
                        if (err) {
                           req.session.err_succss = "Some issued found, to Make Bill";
                            res.redirect("biller");
                        }
                        else {
                           req.session.err_succss = "Bill Successfully created";
                           console.log("kjshdjkfhsd");
                            res.redirect("/biller");
                        }
                    })
                } else {
                    schemas.customer.update({ customer_mobile: req.body.customer_contact, shop_admin: req.session.admin_id }, {
                        $push: {
                            orders: {
                                menu_id: req.body.menu_id,
                                order_date: date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear(),
                                order_time: date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(),
                                quantity: req.body.qty,
                                order_plate_type: req.body.plate_type,
                                order_price_per_quantity: req.body.item_price,
                                order_total_payment: req.body.total_amount,
                                biller_name: req.session.biller_name
                            }
                        }
                    }, (err, data) => {
                        if (err) {
                            console.log(err);
                            req.session.err_succss = "Some issued found!";
                            res.redirect("/biller");
                        } else {
                            console.log("Data inserted")
                            req.session.err_succss = "Bill Successfully Created";
                        }
                    })
                }
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/biller/customers", (req, res) => {
    if (req.session.biller_name) {
        schemas.customer.find({ shop_admin: req.session.admin_id }, (err, data) => {
            if (err) {
                req.session.err_succss = "Some issued found!";
                res.redirect("/biller/customers");
            } else {
                let j = 1;
                for (let obj of data) {
                    obj.__v = j;
                    j = j + 1;
                }
                error = req.session.err_succss;
                delete req.session.err_succss;
                res.render("index", { biller_name: req.session.biller_name, biller_image: req.session.biller_image, biller_customer: true, customers: data, error });
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/biller/orders", (req, res) => {
    if (req.session.biller_name) {
        schemas.customer.find({ customer_mobile: req.query.cid, shop_admin: req.session.admin_id }, (err, data) => {
            if (err) {
                req.session.err_succss = "Some issued found!";
                res.redirect("biller/customers");
            } else {
                let j = 1;
                for (let i of data[0].orders) {
                    schemas.product.find({ _id: i.menu_id }, (err, data) => {
                        if (err) {
                            console.log("err");
                            res.redirect("/biller/orders");
                        } else {
                            i.menu_id = data[0].item_name;
                        }
                    })
                    i.ind = j;
                    j = j + 1;
                }
                error = req.session.err_succss;
                delete req.session.err_succss;
                res.render("index", { biller_name: req.session.biller_name, biller_image: req.session.biller_image, c_order2: true, orders: data[0].orders, error});
            }
        })
    } else {
        req.session.err_succss = "Login is required! Please login";
        res.redirect("/login");
    }
});
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.get("*", (req, res) => {
    res.render("index", { not_found: true })
})


app.listen(PORT, () => {
    console.log("Server is started at port " + PORT);
});