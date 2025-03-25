import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://172.18.0.3:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Signup successful! Redirecting to login...");
        navigate("/login");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-container">
        <div className="left-panel">
          <img src="images/signup.png" alt="Decorative" />
        </div>
        <div className="right-panel">
          <h2>Create an Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <i className="fa fa-user"></i>
              <input type="text" name="firstName" placeholder="First Name" required value={formData.firstName} onChange={handleChange} />
            </div>
            <div className="form-row">
              <i className="fa fa-user"></i>
              <input type="text" name="lastName" placeholder="Last Name" required value={formData.lastName} onChange={handleChange} />
            </div>
            <div className="form-row">
              <i className="fa fa-envelope"></i>
              <input type="email" name="email" placeholder="Email" required value={formData.email} onChange={handleChange} />
            </div>
            <div className="form-row">
              <i className="fa fa-phone"></i>
              <input type="tel" name="phoneNumber" placeholder="Phone Number" required value={formData.phoneNumber} onChange={handleChange} />
            </div>
            <div className="form-row">
              <i className="fa fa-map-marker-alt"></i>
              <input type="text" name="address" placeholder="Address" required value={formData.address} onChange={handleChange} />
            </div>
            <div className="form-row">
              <i className="fa fa-lock"></i>
              <input type="password" name="password" placeholder="Password" required value={formData.password} onChange={handleChange} />
            </div>
            <div className="form-row">
              <i className="fa fa-lock"></i>
              <input type="password" name="confirmPassword" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={handleChange} />
            </div>
            <button type="submit" className="submit-btn">Create Account</button>
          </form>
          <div className="login-link">
            Already have an account? <a href="/login">Login here</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

