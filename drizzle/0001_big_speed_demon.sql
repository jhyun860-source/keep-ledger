CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `keepEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keptOn` date NOT NULL,
	`liquorName` varchar(120) NOT NULL,
	`remainingPercent` int NOT NULL,
	`authorEmployeeId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keepEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keepEntryId` int NOT NULL,
	`customerName` varchar(100) NOT NULL,
	`employeeId` int NOT NULL,
	`withdrawnAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdrawals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `keepEntries` ADD CONSTRAINT `keepEntries_authorEmployeeId_employees_id_fk` FOREIGN KEY (`authorEmployeeId`) REFERENCES `employees`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_keepEntryId_keepEntries_id_fk` FOREIGN KEY (`keepEntryId`) REFERENCES `keepEntries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `employees_active_idx` ON `employees` (`isActive`);--> statement-breakpoint
CREATE INDEX `keep_entries_date_idx` ON `keepEntries` (`keptOn`);--> statement-breakpoint
CREATE INDEX `keep_entries_author_idx` ON `keepEntries` (`authorEmployeeId`);--> statement-breakpoint
CREATE INDEX `keep_entries_liquor_idx` ON `keepEntries` (`liquorName`);--> statement-breakpoint
CREATE INDEX `withdrawals_keep_entry_idx` ON `withdrawals` (`keepEntryId`);--> statement-breakpoint
CREATE INDEX `withdrawals_employee_idx` ON `withdrawals` (`employeeId`);