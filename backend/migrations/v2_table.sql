-- TABLE: PRODUCTS (Combines PRODUIT and STOCK concepts)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    -- Status is stored, but could be calculated. 
    -- 'CRITIQUE', 'EN_STOCK', 'RUPTURE', 'FAIBLE'
    stock_status stock_status_enum DEFAULT 'EN_STOCK',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- TABLE: CUSTOMERS (CLIENT)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    -- 'historique' is usually a count of orders, best calculated dynamically.
    -- We will not store it to avoid synchronization errors, but we keep the column if explicitely requested as a cache.
    order_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Constaint: At least one contact method must be present
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
        -- Price at the moment of purchase
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_reference ON products(reference);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);