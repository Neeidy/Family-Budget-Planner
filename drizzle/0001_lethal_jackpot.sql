CREATE TABLE `budgetData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentMonth` varchar(20) NOT NULL,
	`incomes` text NOT NULL,
	`expenses` text NOT NULL,
	`debts` text NOT NULL,
	`savings` text NOT NULL,
	`annualPayments` text NOT NULL,
	`budgetLimits` text NOT NULL,
	`savingsGoals` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `familyBudget` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` varchar(64) NOT NULL,
	`incomes` text NOT NULL,
	`expenses` text NOT NULL,
	`debts` text NOT NULL,
	`savings` text NOT NULL,
	`annualPayments` text NOT NULL,
	`budgetLimits` text NOT NULL,
	`savingsGoals` text NOT NULL,
	`installments` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `familyBudget_id` PRIMARY KEY(`id`),
	CONSTRAINT `familyBudget_familyId_unique` UNIQUE(`familyId`)
);
--> statement-breakpoint
CREATE TABLE `familyBudgetHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` varchar(64) NOT NULL,
	`snapshot` text NOT NULL,
	`savedBy` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `familyBudgetHistory_id` PRIMARY KEY(`id`)
);
