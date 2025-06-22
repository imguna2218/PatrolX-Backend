-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'worker');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "PatrolAssignmentStatus" AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PatrolSessionStatus" AS ENUM ('not_started', 'in_progress', 'paused', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "CheckpointVisitStatus" AS ENUM ('pending', 'arrived', 'completed', 'skipped');

-- CreateEnum
CREATE TYPE "GeofenceStatus" AS ENUM ('inside', 'outside');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('photo', 'video', 'audio', 'document');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('assignment', 'alert', 'reminder', 'system');

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),
    "profile_image_url" VARCHAR(500),
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHierarchy" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAvailability" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "WorkerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkpoints" (
    "id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "radius_meters" INTEGER NOT NULL DEFAULT 50,
    "sequence_order" INTEGER NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrolAssignments" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "shift_name" VARCHAR(100),
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "expected_start_time" TIME,
    "expected_end_time" TIME,
    "estimated_duration_minutes" INTEGER,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "status" "PatrolAssignmentStatus" NOT NULL DEFAULT 'pending',
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "PatrolAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentLocations" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "expected_duration_minutes" INTEGER,
    "special_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentLocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrolSessions" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "session_date" DATE NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "total_duration_minutes" INTEGER,
    "completed_checkpoints_count" INTEGER NOT NULL DEFAULT 0,
    "progress_percentage" DECIMAL(5,2),
    "status" "PatrolSessionStatus" NOT NULL DEFAULT 'not_started',
    "start_latitude" DECIMAL(10,8),
    "start_longitude" DECIMAL(11,8),
    "end_latitude" DECIMAL(10,8),
    "end_longitude" DECIMAL(11,8),
    "total_distance_meters" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "PatrolSessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckpointVisits" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "assignment_location_id" TEXT NOT NULL,
    "checkpoint_id" TEXT NOT NULL,
    "arrived_at" TIMESTAMP(3),
    "departed_at" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "distance_from_target_meters" INTEGER,
    "geofence_status" "GeofenceStatus",
    "status" "CheckpointVisitStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "CheckpointVisits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationTracks" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "accuracy_meters" DOUBLE PRECISION,
    "speed_mps" DOUBLE PRECISION,
    "bearing" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "battery_level" INTEGER,
    "is_online" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationTracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrolMedia" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "checkpoint_visit_id" TEXT,
    "media_type" "MediaType" NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size_bytes" BIGINT,
    "mime_type" VARCHAR(100),
    "caption" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "captured_at" TIMESTAMP(3) NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "PatrolMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incidents" (
    "id" TEXT NOT NULL,
    "session_id" TEXT,
    "checkpoint_visit_id" TEXT,
    "reported_by" TEXT NOT NULL,
    "incident_type" VARCHAR(100) NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'medium',
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "status" "IncidentStatus" NOT NULL DEFAULT 'open',
    "assigned_to" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" VARCHAR(500),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "related_entity_type" VARCHAR(50),
    "related_entity_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) DEFAULT 'general',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "Users"("role");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "Users"("status");

-- CreateIndex
CREATE INDEX "idx_users_created_by" ON "Users"("created_by");

-- CreateIndex
CREATE INDEX "idx_user_hierarchy_parent" ON "UserHierarchy"("parent_id");

-- CreateIndex
CREATE INDEX "idx_user_hierarchy_child" ON "UserHierarchy"("child_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserHierarchy_parent_id_child_id_key" ON "UserHierarchy"("parent_id", "child_id");

-- CreateIndex
CREATE INDEX "idx_checkpoints_location" ON "Checkpoints"("location_id");

-- CreateIndex
CREATE INDEX "idx_patrol_assignments_worker" ON "PatrolAssignments"("worker_id");

-- CreateIndex
CREATE INDEX "idx_patrol_assignments_status" ON "PatrolAssignments"("status");

-- CreateIndex
CREATE INDEX "idx_patrol_assignments_date" ON "PatrolAssignments"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "idx_assignment_locations_assignment" ON "AssignmentLocations"("assignment_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentLocations_assignment_id_location_id_key" ON "AssignmentLocations"("assignment_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentLocations_assignment_id_sequence_order_key" ON "AssignmentLocations"("assignment_id", "sequence_order");

-- CreateIndex
CREATE INDEX "idx_patrol_sessions_worker" ON "PatrolSessions"("worker_id");

-- CreateIndex
CREATE INDEX "idx_patrol_sessions_date" ON "PatrolSessions"("session_date");

-- CreateIndex
CREATE INDEX "idx_patrol_sessions_status" ON "PatrolSessions"("status");

-- CreateIndex
CREATE INDEX "idx_checkpoint_visits_session" ON "CheckpointVisits"("session_id");

-- CreateIndex
CREATE INDEX "idx_checkpoint_visits_checkpoint" ON "CheckpointVisits"("checkpoint_id");

-- CreateIndex
CREATE INDEX "idx_location_tracks_worker" ON "LocationTracks"("worker_id");

-- CreateIndex
CREATE INDEX "idx_incidents_status" ON "Incidents"("status");

-- CreateIndex
CREATE INDEX "idx_incidents_severity" ON "Incidents"("severity");

-- CreateIndex
CREATE INDEX "idx_incidents_reported_by" ON "Incidents"("reported_by");

-- CreateIndex
CREATE INDEX "idx_notifications_user_unread" ON "Notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "idx_notifications_entity" ON "Notifications"("related_entity_type", "related_entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_key_key" ON "AppSettings"("key");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHierarchy" ADD CONSTRAINT "UserHierarchy_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHierarchy" ADD CONSTRAINT "UserHierarchy_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAvailability" ADD CONSTRAINT "WorkerAvailability_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locations" ADD CONSTRAINT "Locations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkpoints" ADD CONSTRAINT "Checkpoints_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrolAssignments" ADD CONSTRAINT "PatrolAssignments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrolAssignments" ADD CONSTRAINT "PatrolAssignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentLocations" ADD CONSTRAINT "AssignmentLocations_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "PatrolAssignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentLocations" ADD CONSTRAINT "AssignmentLocations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "Locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrolSessions" ADD CONSTRAINT "PatrolSessions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "PatrolAssignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrolSessions" ADD CONSTRAINT "PatrolSessions_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointVisits" ADD CONSTRAINT "CheckpointVisits_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "PatrolSessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointVisits" ADD CONSTRAINT "CheckpointVisits_assignment_location_id_fkey" FOREIGN KEY ("assignment_location_id") REFERENCES "AssignmentLocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckpointVisits" ADD CONSTRAINT "CheckpointVisits_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "Checkpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationTracks" ADD CONSTRAINT "LocationTracks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "PatrolSessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationTracks" ADD CONSTRAINT "LocationTracks_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrolMedia" ADD CONSTRAINT "PatrolMedia_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "PatrolSessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatrolMedia" ADD CONSTRAINT "PatrolMedia_checkpoint_visit_id_fkey" FOREIGN KEY ("checkpoint_visit_id") REFERENCES "CheckpointVisits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidents" ADD CONSTRAINT "Incidents_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "PatrolSessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidents" ADD CONSTRAINT "Incidents_checkpoint_visit_id_fkey" FOREIGN KEY ("checkpoint_visit_id") REFERENCES "CheckpointVisits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidents" ADD CONSTRAINT "Incidents_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidents" ADD CONSTRAINT "Incidents_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogs" ADD CONSTRAINT "AuditLogs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
