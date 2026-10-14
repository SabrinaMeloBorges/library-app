-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `email` VARCHAR(160) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auth_sessions_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `books` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `authors` VARCHAR(255) NOT NULL,
    `publisher` VARCHAR(160) NULL,
    `page_count` INTEGER NULL,
    `cover_url` VARCHAR(500) NULL,
    `isbn` VARCHAR(20) NULL,
    `external_source` VARCHAR(40) NULL,
    `external_id` VARCHAR(120) NULL,
    `created_by_user_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `books_title_idx`(`title`),
    UNIQUE INDEX `books_external_source_external_id_key`(`external_source`, `external_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_books` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `book_id` CHAR(36) NOT NULL,
    `status` ENUM('WANT_TO_READ', 'READING', 'FINISHED', 'PAUSED', 'ABANDONED') NOT NULL DEFAULT 'WANT_TO_READ',
    `total_pages` INTEGER NOT NULL,
    `current_page` INTEGER NOT NULL DEFAULT 0,
    `rating` TINYINT NULL,
    `is_favorite` BOOLEAN NOT NULL DEFAULT false,
    `review` TEXT NULL,
    `started_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_books_user_id_status_idx`(`user_id`, `status`),
    INDEX `user_books_user_id_finished_at_idx`(`user_id`, `finished_at`),
    UNIQUE INDEX `user_books_user_id_book_id_key`(`user_id`, `book_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reading_sessions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `user_book_id` CHAR(36) NOT NULL,
    `start_page` INTEGER NOT NULL,
    `end_page` INTEGER NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `read_at` DATETIME(3) NOT NULL,
    `note` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reading_sessions_user_id_read_at_idx`(`user_id`, `read_at`),
    INDEX `reading_sessions_user_book_id_idx`(`user_book_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reading_goals` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `type` ENUM('BOOKS_FINISHED', 'PAGES_READ', 'MINUTES_READ', 'READING_DAYS') NOT NULL,
    `period` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM') NOT NULL,
    `target_value` INTEGER NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reading_goals_user_id_end_date_idx`(`user_id`, `end_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_books` ADD CONSTRAINT `user_books_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_books` ADD CONSTRAINT `user_books_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_sessions` ADD CONSTRAINT `reading_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_sessions` ADD CONSTRAINT `reading_sessions_user_book_id_fkey` FOREIGN KEY (`user_book_id`) REFERENCES `user_books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reading_goals` ADD CONSTRAINT `reading_goals_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraints
ALTER TABLE `user_books` ADD CONSTRAINT `user_books_total_pages_check` CHECK (`total_pages` > 0);
ALTER TABLE `user_books` ADD CONSTRAINT `user_books_current_page_check` CHECK (`current_page` >= 0 AND `current_page` <= `total_pages`);
ALTER TABLE `user_books` ADD CONSTRAINT `user_books_rating_check` CHECK (`rating` IS NULL OR (`rating` BETWEEN 1 AND 5));
ALTER TABLE `reading_sessions` ADD CONSTRAINT `reading_sessions_pages_check` CHECK (`start_page` >= 0 AND `end_page` > `start_page`);
ALTER TABLE `reading_sessions` ADD CONSTRAINT `reading_sessions_duration_check` CHECK (`duration_minutes` BETWEEN 1 AND 1440);
ALTER TABLE `reading_goals` ADD CONSTRAINT `reading_goals_target_check` CHECK (`target_value` > 0);
ALTER TABLE `reading_goals` ADD CONSTRAINT `reading_goals_dates_check` CHECK (`end_date` >= `start_date`);
