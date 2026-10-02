-- Disable foreign key checks during creation to prevent order issues
SET FOREIGN_KEY_CHECKS = 0;

USE docsmeet;

-- 1. users table
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `salutation` VARCHAR(10),
  `f_name` VARCHAR(20),
  `l_name` VARCHAR(20) NULL,
  `email` VARCHAR(45),
  `user_role` VARCHAR(10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. u_passwords table
CREATE TABLE IF NOT EXISTS `u_passwords` (
  `user_id` INT,
  `u_password` CHAR(32),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. meetings table
CREATE TABLE IF NOT EXISTS `meetings` (
  `meeting_id` INT AUTO_INCREMENT PRIMARY KEY,
  `link` VARCHAR(10),
  `meeting_host` INT,
  `meeting_time` TIMESTAMP,
  FOREIGN KEY (`meeting_host`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. reports table
CREATE TABLE IF NOT EXISTS `reports` (
  `report_id` INT AUTO_INCREMENT PRIMARY KEY,
  `meeting_id` INT,
  `file_owner` INT,
  `location` VARCHAR(200),
  FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`meeting_id`) ON DELETE CASCADE,
  FOREIGN KEY (`file_owner`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. recordings table
CREATE TABLE IF NOT EXISTS `recordings` (
  `recording_id` INT AUTO_INCREMENT PRIMARY KEY,
  `meeting_id` INT,
  `location` VARCHAR(200),
  FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`meeting_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. guests table
CREATE TABLE IF NOT EXISTS `guests` (
  `meeting_id` INT,
  `email` VARCHAR(45),
  FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`meeting_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. participants table
CREATE TABLE IF NOT EXISTS `participants` (
  `meeting_id` INT,
  `user_id` INT,
  `participant_role` VARCHAR(10),
  FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`meeting_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. chats table
CREATE TABLE IF NOT EXISTS `chats` (
  `meeting_id` INT,
  `sender` INT NULL,
  `name` VARCHAR(20),
  `message` TEXT,
  `message_time` TIMESTAMP,
  FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`meeting_id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;