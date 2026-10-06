import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

const initialBooks = [
  { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classic', isbn: '9780743273565', quantity: 5 },
  { id: '2', title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', isbn: '9780061120084', quantity: 1 }
];

const initialUsers = [
  { id: '1', name: 'Alice Smith', membershipId: 'MEM001', role: 'Librarian' },
  { id: '2', name: 'Bob Jones', membershipId: 'MEM002', role: 'Member' }
];

export const AppProvider = ({ children }) => {
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem('library_books');
    return saved ? JSON.parse(saved) : initialBooks;
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('library_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('library_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('library_session');
    return saved ? JSON.parse(saved) : null;
  });

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
    if (user) { setCurrentUser(user); return true; }
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
};