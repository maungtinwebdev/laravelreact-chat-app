-- Create expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Insert default categories
INSERT INTO expense_categories (name, description) VALUES
    ('Food & Dining', 'Expenses related to food, restaurants, and dining out'),
    ('Transportation', 'Expenses for travel, fuel, and public transport'),
    ('Housing', 'Rent, mortgage, and housing-related expenses'),
    ('Utilities', 'Electricity, water, gas, and other utilities'),
    ('Entertainment', 'Movies, games, and entertainment expenses'),
    ('Shopping', 'Clothing, electronics, and general shopping'),
    ('Healthcare', 'Medical expenses and healthcare costs'),
    ('Education', 'Tuition, books, and educational expenses'),
    ('Personal Care', 'Beauty, grooming, and personal care items'),
    ('Gifts & Donations', 'Gifts, charity, and donations'),
    ('Travel', 'Vacation and travel expenses'),
    ('Business', 'Business-related expenses'),
    ('Other', 'Miscellaneous expenses');

-- Create RLS policies
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read categories
CREATE POLICY "Allow read access to all authenticated users" ON expense_categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to manage their own expenses
CREATE POLICY "Users can manage their own expenses" ON expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
