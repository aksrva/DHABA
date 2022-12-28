const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/DHABA");

let product_schema = {
    item_name: String,
    half_plate_price: Number,
    full_plate_price: Number,
    item_image: String,
    available: Boolean,
    administrator: String
}
let product = mongoose.models.PRODUCT || mongoose.model("PRODUCT", product_schema, "menus");

let users_schema = {
    admin_name: String,
    admin_contact: {
        type: Number,
        unique: true,
    },
    admin_location: String,
    admin_email_id: {
        type: String,
        unique: true,
    },
    admin_password: String,
    admin_shop_name: String,
    admin_image: String
}
let user_model = mongoose.models.USERS || mongoose.model("USERS", users_schema, "admin");

let users_biller = {
    counter_billing_name: String,
    counter_billing_contact: {
        type: Number,
        unique: true,
    },
    counter_billing_address: String,
    counter_email_id: {
        type: String,
        unique: true,
    },
    available: Boolean,
    counter_password: String,
    biller_image: String,
    counter_admin: String
}
let biller = mongoose.models.BILLER || mongoose.model("BILLER", users_biller, "counter_billing");

let customer_schema = {
    customer_name: String,
    customer_mobile: Number,
    orders: [
        {
            menu_id: String,
            order_date: String,
            order_time: String, 
            quantity: Number,
            order_plate_type: String,
            order_price_per_quantity: Number,
            order_total_payment: Number,
            biller_name: String,
            ind: Number,
        }
    ],
    shop_admin: String
}
let customer = mongoose.models.CUSTOMER || mongoose.model("CUSTOMER", customer_schema, "customers");
module.exports = {user_model, product, biller, customer};