from flask import Flask, jsonify, request

app = Flask(__name__)


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():
    return jsonify({
        "application": "Demo E-Commerce API",
        "version": "1.0",
        "status": "running",
        "message": "Test API for API Security Testing Tool",
        "endpoints": [
            "/api/users",
            "/api/users/1",
            "/api/products",
            "/api/products/101",
            "/api/orders",
            "/api/orders/1001",
            "/api/login",
            "/api/profile",
            "/api/admin",
            "/api/search",
            "/api/reflection",
            "/api/debug",
            "/api/config"
        ]
    })


# =========================================================
# USERS
# =========================================================

users = [
    {
        "id": 1,
        "name": "Arun Kumar",
        "email": "arun@example.com",
        "role": "customer",
        "status": "active"
    },
    {
        "id": 2,
        "name": "Priya Sharma",
        "email": "priya@example.com",
        "role": "customer",
        "status": "active"
    },
    {
        "id": 3,
        "name": "Rahul Singh",
        "email": "rahul@example.com",
        "role": "customer",
        "status": "active"
    }
]


@app.route("/api/users", methods=["GET"])
def get_users():
    return jsonify(users)


@app.route("/api/users/<int:user_id>", methods=["GET"])
def get_user(user_id):

    for user in users:
        if user["id"] == user_id:
            return jsonify(user)

    return jsonify({
        "error": "User not found"
    }), 404


@app.route("/api/users", methods=["POST"])
def create_user():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "JSON request body is required"
        }), 400

    new_user = {
        "id": len(users) + 1,
        "name": data.get("name"),
        "email": data.get("email"),
        "role": "customer",
        "status": "active"
    }

    users.append(new_user)

    return jsonify({
        "message": "User created successfully",
        "user": new_user
    }), 201


@app.route("/api/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):

    data = request.get_json(silent=True)

    for user in users:

        if user["id"] == user_id:

            if data:
                user["name"] = data.get(
                    "name",
                    user["name"]
                )

                user["email"] = data.get(
                    "email",
                    user["email"]
                )

            return jsonify({
                "message": "User updated successfully",
                "user": user
            })

    return jsonify({
        "error": "User not found"
    }), 404


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):

    for user in users:

        if user["id"] == user_id:

            users.remove(user)

            return jsonify({
                "message": "User deleted successfully"
            })

    return jsonify({
        "error": "User not found"
    }), 404


# =========================================================
# PRODUCTS
# =========================================================

products = [
    {
        "id": 101,
        "name": "Laptop",
        "category": "Electronics",
        "price": 54999,
        "stock": 25
    },
    {
        "id": 102,
        "name": "Wireless Mouse",
        "category": "Accessories",
        "price": 899,
        "stock": 100
    },
    {
        "id": 103,
        "name": "Keyboard",
        "category": "Accessories",
        "price": 1499,
        "stock": 60
    }
]


@app.route("/api/products", methods=["GET"])
def get_products():
    return jsonify(products)


@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):

    for product in products:

        if product["id"] == product_id:
            return jsonify(product)

    return jsonify({
        "error": "Product not found"
    }), 404


@app.route("/api/products", methods=["POST"])
def create_product():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "JSON request body is required"
        }), 400

    product = {
        "id": len(products) + 101,
        "name": data.get("name"),
        "category": data.get("category"),
        "price": data.get("price"),
        "stock": data.get("stock", 0)
    }

    products.append(product)

    return jsonify({
        "message": "Product created successfully",
        "product": product
    }), 201


# =========================================================
# ORDERS
# =========================================================

orders = [
    {
        "order_id": "ORD1001",
        "user_id": 1,
        "product_id": 101,
        "quantity": 1,
        "total": 54999,
        "status": "confirmed"
    },
    {
        "order_id": "ORD1002",
        "user_id": 2,
        "product_id": 102,
        "quantity": 2,
        "total": 1798,
        "status": "shipped"
    }
]


@app.route("/api/orders", methods=["GET"])
def get_orders():
    return jsonify(orders)


@app.route("/api/orders/<order_id>", methods=["GET"])
def get_order(order_id):

    for order in orders:

        if order["order_id"] == order_id:
            return jsonify(order)

    return jsonify({
        "error": "Order not found"
    }), 404


@app.route("/api/orders", methods=["POST"])
def create_order():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "JSON request body is required"
        }), 400

    order = {
        "order_id": "ORD" + str(1000 + len(orders) + 1),
        "user_id": data.get("user_id"),
        "product_id": data.get("product_id"),
        "quantity": data.get("quantity", 1),
        "total": data.get("total", 0),
        "status": "pending"
    }

    orders.append(order)

    return jsonify({
        "message": "Order created successfully",
        "order": order
    }), 201


# =========================================================
# LOGIN
# =========================================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Login data is required"
        }), 400

    email = data.get("email")
    password = data.get("password")

    if email == "admin@example.com" and password == "demo123":
        return jsonify({
            "message": "Login successful",
            "token": "DEMO_TOKEN_12345",
            "user": {
                "id": 99,
                "name": "Demo Admin",
                "role": "admin"
            }
        })

    return jsonify({
        "error": "Invalid email or password"
    }), 401


# =========================================================
# PROFILE
# =========================================================

@app.route("/api/profile", methods=["GET"])
def profile():

    authorization = request.headers.get("Authorization")

    if not authorization:
        return jsonify({
            "error": "Authentication required",
            "message": "Please provide an Authorization header"
        }), 401

    return jsonify({
        "id": 1,
        "name": "Arun Kumar",
        "email": "arun@example.com",
        "role": "customer"
    })


# =========================================================
# ADMIN
# =========================================================

@app.route("/api/admin", methods=["GET"])
def admin():

    authorization = request.headers.get("Authorization")

    if not authorization:
        return jsonify({
            "error": "Admin authentication required"
        }), 401

    return jsonify({
        "message": "Admin area",
        "users": len(users),
        "products": len(products),
        "orders": len(orders)
    })


# =========================================================
# SEARCH
# =========================================================

@app.route("/api/search", methods=["GET"])
def search():

    query = request.args.get("query", "")

    results = []

    for product in products:

        if query.lower() in product["name"].lower():

            results.append(product)

    return jsonify({
        "query": query,
        "results": results
    })


# =========================================================
# INPUT REFLECTION TEST
# =========================================================

@app.route("/api/reflection", methods=["GET"])
def reflection():

    user_input = request.args.get(
        "input",
        ""
    )

    return jsonify({
        "message": "Input received",
        "received_input": user_input
    })


# =========================================================
# DEBUG / ERROR TEST
# =========================================================

@app.route("/api/debug", methods=["GET"])
def debug():

    debug_mode = request.args.get(
        "error",
        ""
    )

    if debug_mode:

        return jsonify({
            "error": "Database error",
            "details": "MySQL database error occurred while processing the request",
            "exception": "DemoDatabaseException",
            "file": "/app/database.py",
            "line": 42
        }), 500

    return jsonify({
        "debug": False,
        "message": "Debug endpoint is available for testing"
    })


# =========================================================
# CONFIG / SENSITIVE DATA TEST
# =========================================================

@app.route("/api/config", methods=["GET"])
def config():

    return jsonify({
        "application": "Demo E-Commerce API",
        "environment": "testing",
        "api_key": "DEMO_API_KEY_12345",
        "token": "DEMO_TOKEN_12345",
        "secret": "DEMO_SECRET_12345",
        "authorization": "Bearer DEMO_AUTH_TOKEN"
    })


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )
