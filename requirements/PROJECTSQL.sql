CREATE TABLE _users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Member','Admin','Support') DEFAULT 'Member',
  is_premium BOOLEAN DEFAULT FALSE,
  status ENUM('active','suspended','deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE _user_profiles (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  name VARCHAR(255),
  company VARCHAR(255),
  title VARCHAR(255),
  bio TEXT
);