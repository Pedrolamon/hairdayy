import React, { useState } from 'react';

// Define the structure for the form data
interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
}

const RegisterForm: React.FC = () => {
  // State to hold form input values
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    role: 'barber', // Default role as per your backend
    phone: '',
  });

  // State for messages (success or error)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // State for loading indicator
  const [loading, setLoading] = useState<boolean>(false);

  // Handle input changes and update the form data state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submission
    setLoading(true);   // Set loading to true when submission starts
    setMessage(null);   // Clear previous messages

    try {
      // Make the API call to your backend's /register endpoint
      const response = await fetch('http://localhost:4000/api/auth/register', { // Adjust the URL if your backend is on a different port/domain
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // If registration is successful
        setMessage({ type: 'success', text: data.message || 'Registration successful!' });
        // Optionally clear the form after successful registration
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'barber',
          phone: '',
        });
      } else {
        // If there's an error from the backend
        setMessage({ type: 'error', text: data.message || 'Registration failed.' });
      }
    } catch (error) {
      // Catch network errors or other unexpected issues
      console.error('Error during registration:', error);
      setMessage({ type: 'error', text: 'Network error or server unavailable. Please try again later.' });
    } finally {
      setLoading(false); // Set loading to false after submission completes
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Register Account</h2>

        {/* Display messages */}
        {message && (
          <div
            className={`p-3 mb-4 rounded-md text-sm ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Role Select */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="barber">Barber</option>
              <option value="client">Client</option>
              {/* Add other roles if applicable */}
            </select>
          </div>

          {/* Phone Input */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel" // Use type="tel" for phone numbers
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading} // Disable button while loading
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
