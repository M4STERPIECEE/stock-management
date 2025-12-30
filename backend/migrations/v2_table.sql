-- TABLE: CATEGORIES (Must be created before products)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: PRODUCTS (Combines PRODUIT and STOCK concepts)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    -- Status is stored, but could be calculated. 
    -- 'CRITIQUE', 'EN_STOCK', 'RUPTURE', 'FAIBLE'
    stock_status stock_status_enum DEFAULT 'EN_STOCK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_reference ON products(reference);
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    order_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_contact_info CHECK (
        (
            email IS NOT NULL
            AND email <> ''
        )
        OR (
            phone IS NOT NULL
            AND phone <> ''
        )
    )
);
-- TABLE: ORDERS (COMMANDE)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE
    SET NULL,
        order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status order_status_enum DEFAULT 'EN_ATTENTE',
        total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- TABLE: ORDER_ITEMS (Details of the order, linking Orders and Products)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE
    SET NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- TABLE: ADMIN_USER (Gestion utilisateur/Rôle uniquement Administrateur)
-- Only one admin should exist, we enforce this with a logical check or by constraints if needed, but here we provide the structure.
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'ADMIN' CHECK (role = 'ADMIN'),
    phone_number VARCHAR(50),
    profile_picture TEXT,
    -- Enforce ADMIN role
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Indexes for performance
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);