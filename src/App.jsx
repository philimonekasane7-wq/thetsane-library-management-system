import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

// --- CONTEXT ---
export const AppContext = createContext();

const initialBooks = [
  { id: '1', title: 'Mopheme', author: 'F. Scott Fitzgerald', genre: 'Classic', isbn: '9780743273565', quantity: 10 },
  { id: '2', title: 'Masoabi', author: 'Harper Lee', genre: 'Fiction', isbn: '9780061120084', quantity: 5}
];

const initialUsers = [
  { id: '1', name: 'Alice Smith', membershipId: 'MEM001', role: 'Librarian' },
  { id: '2', name: 'Bob Jones', membershipId: 'MEM002', role: 'Member' }
];

function AppProvider({ children }) {
  const [books, setBooks] = useState(() => JSON.parse(localStorage.getItem('library_books')) || initialBooks);
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('library_users')) || initialUsers);
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('library_transactions')) || []);
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('library_session')) || null);

  useEffect(() => { localStorage.setItem('library_books', JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem('library_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('library_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('library_session', JSON.stringify(currentUser));
    else localStorage.removeItem('library_session');
  }, [currentUser]);

  const addBook = (book) => setBooks([...books, { ...book, id: Date.now().toString(), quantity: Number(book.quantity) }]);
  const updateBook = (updatedBook) => setBooks(books.map(b => b.id === updatedBook.id ? { ...updatedBook, quantity: Number(updatedBook.quantity) } : b));
  const deleteBook = (id) => setBooks(books.filter(b => b.id !== id));

  const addUser = (user) => setUsers([...users, { ...user, id: Date.now().toString() }]);
  const updateUser = (updatedUser) => setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  const deleteUser = (id) => setUsers(users.filter(u => u.id !== id));

  const handleStockTransaction = (bookId, amount, type) => {
    setBooks(books.map(b => {
      if (b.id === bookId) {
        const newQty = type === 'ADD' ? b.quantity + amount : b.quantity - amount;
        return { ...b, quantity: Math.max(0, newQty) };
      }
      return b;
    }));

    const book = books.find(b => b.id === bookId);
    setTransactions([
      { id: Date.now().toString(), bookTitle: book ? book.title : 'Unknown', type, amount, date: new Date().toLocaleString() },
      ...transactions
    ]);
  };

  const login = (membershipId) => {
    const user = users.find(u => u.membershipId === membershipId);
    if (user) { 
      setCurrentUser(user); 
      return true; 
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  return (
    <AppContext.Provider value={{
      books, addBook, updateBook, deleteBook,
      users, addUser, updateUser, deleteUser,
      transactions, handleStockTransaction,
      currentUser, login, logout
    }}>
      {children}
    </AppContext.Provider>
  );
}


function Navbar() {
  const { currentUser, logout } = useContext(AppContext);
  return (
    <nav className="navbar">
      <h2>THETSANE COMMUNITY LIBRARY</h2>
      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/books">Books</Link>
        <Link to="/transactions">Transactions</Link>
        <Link to="/users">User Management</Link>
      </div>
      <div>
        {currentUser && (
          <span>
            <button onClick={logout} className="btn-secondary" style={{ marginLeft: '10px' }}>Logout</button>
          </span>
        )}
      </div>
    </nav>
  );
}

function LoginForm() {
  const { login } = useContext(AppContext);
  const [membershipId, setMembershipId] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const success = login(membershipId.trim());
    if (!success) {
      setError('Invalid Membership ID. Try MEM001 or MEM002');
    } else {
      setError('');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '4rem', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>THETSANE COMMUNITY LIBRARY</h2>
      <p style={{ color: '#6e5a63', marginBottom: '1.5rem' }}>Please enter your Membership ID to sign in.</p>
      
      {error && <p style={{ color: '#a83b48', fontWeight: 'bold' }}>{error}</p>}

      <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Membership ID" 
          value={membershipId} 
          onChange={(e) => setMembershipId(e.target.value)} 
          required 
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
        <button type="submit" style={{ padding: '0.75rem', fontSize: '1rem' }}>Sign In</button>
      </form>
      <p style={{ fontSize: '0.85rem', color: '#6e5a63', marginTop: '1rem' }}>
        Demo Accounts: <strong>MEM001</strong> (Librarian) or <strong>MEM002</strong> (Member)
      </p>
    </div>
  );
}

function Dashboard() {
  const { books } = useContext(AppContext);
  return (
    <div className="container">
      <h2>Dashboard</h2>
      <p style={{ color: '#6e5a63' }}>Books with low stock (fewer than 2 copies) are highlighted in red.</p>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th><th>Author</th><th>Genre</th><th>ISBN</th><th>Stock Qty</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {books.map(book => {
            const isLow = book.quantity < 2;
            return (
              <tr key={book.id} className={isLow ? 'low-stock-row' : ''}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.genre}</td>
                <td>{book.isbn}</td>
                <td><strong>{book.quantity}</strong></td>
                <td>
                  {isLow ? <span className="status-badge low">Low Stock</span> : <span className="status-badge ok">Sufficient</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BookManagement() {
  const { books, addBook, updateBook, deleteBook } = useContext(AppContext);
  const [form, setForm] = useState({ id: '', title: '', author: '', genre: '', isbn: '', quantity: '' });
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) { updateBook(form); setIsEditing(false); } 
    else { addBook(form); }
    setForm({ id: '', title: '', author: '', genre: '', isbn: '', quantity: '' });
  };

  return (
    <div className="container">
      <h2>Book Management</h2>
      <form onSubmit={handleSubmit} className="form-card">
        <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
        <input placeholder="Author" value={form.author} onChange={e => setForm({...form, author: e.target.value})} required />
        <input placeholder="Genre" value={form.genre} onChange={e => setForm({...form, genre: e.target.value})} />
        <input placeholder="ISBN" value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})} required />
        <input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} min="0" required style={{ width: '80px' }} />
        <button type="submit">{isEditing ? 'Update Book' : 'Add Book'}</button>
        {isEditing && (
          <button type="button" className="btn-secondary" onClick={() => { setIsEditing(false); setForm({ id: '', title: '', author: '', genre: '', isbn: '', quantity: '' }); }}>
            Cancel
          </button>
        )}
      </form>

      <table className="table">
        <thead>
          <tr><th>Title</th><th>Author</th><th>Genre</th><th>ISBN</th><th>Quantity</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {books.map(b => (
            <tr key={b.id}>
              <td>{b.title}</td><td>{b.author}</td><td>{b.genre}</td><td>{b.isbn}</td><td>{b.quantity}</td>
              <td>
                <button onClick={() => { setForm(b); setIsEditing(true); }} style={{ marginRight: '5px' }}>Edit</button>
                <button className="btn-danger" onClick={() => deleteBook(b.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Transactions() {
  const { books, handleStockTransaction, transactions } = useContext(AppContext);
  const [selectedBook, setSelectedBook] = useState('');
  const [amount, setAmount] = useState(1);

  return (
    <div className="container">
      <h2>Availability Transactions</h2>
      <div className="form-card">
        <select value={selectedBook} onChange={e => setSelectedBook(e.target.value)}>
          <option value="">-- Select Book --</option>
          {books.map(b => <option key={b.id} value={b.id}>{b.title} (Stock: {b.quantity})</option>)}
        </select>
        <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '60px' }} />
        <button className="btn-success" onClick={() => selectedBook && handleStockTransaction(selectedBook, Number(amount), 'ADD')}>Add Stock</button>
        <button className="btn-danger" onClick={() => selectedBook && handleStockTransaction(selectedBook, Number(amount), 'DEDUCT')}>Deduct (Borrow)</button>
      </div>

      <h3>Transaction History Log</h3>
      <table className="table">
        <thead>
          <tr><th>Date</th><th>Book Title</th><th>Type</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8' }}>No transactions recorded yet.</td></tr>
          ) : (
            transactions.map(t => (
              <tr key={t.id}>
                <td>{t.date}</td><td>{t.bookTitle}</td>
                <td style={{ color: t.type === 'ADD' ? '#2e6b52' : '#a83b48', fontWeight: 'bold' }}>{t.type}</td>
                <td>{t.amount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useContext(AppContext);
  const [userForm, setUserForm] = useState({ id: '', name: '', membershipId: '', role: 'Member' });
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) { updateUser(userForm); setIsEditing(false); } 
    else { addUser(userForm); }
    setUserForm({ id: '', name: '', membershipId: '', role: 'Member' });
  };

  return (
    <div className="container">
      <h2>User Management</h2>
      <h3>{isEditing ? 'Edit User Details' : 'Add New User'}</h3>
      <form onSubmit={handleSubmit} className="form-card">
        <input placeholder="Name" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} required />
        <input placeholder="Membership ID" value={userForm.membershipId} onChange={e => setUserForm({...userForm, membershipId: e.target.value})} required />
        <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
          <option value="Member">Member</option>
          <option value="Librarian">Librarian</option>
        </select>
        <button type="submit">{isEditing ? 'Update User' : 'Add User'}</button>
      </form>

      <table className="table">
        <thead>
          <tr><th>Name</th><th>Membership ID</th><th>Role</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td><td>{u.membershipId}</td><td>{u.role}</td>
              <td>
                <button onClick={() => { setUserForm(u); setIsEditing(true); }} style={{ marginRight: '5px' }}>Edit</button>
                <button className="btn-danger" onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MainLayout() {
  const { currentUser } = useContext(AppContext);

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/books" element={<BookManagement />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

// --- MAIN APP ---
export default function App() {
  return (
    <AppProvider>
      <Router>
        <MainLayout />
      </Router>
    </AppProvider>
  );
}