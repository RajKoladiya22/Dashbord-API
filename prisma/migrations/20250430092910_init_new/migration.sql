-- CreateTable
CREATE TABLE "login_audit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "login_credential_id" UUID NOT NULL,
    "attempt_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_audit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "login_audit" ADD CONSTRAINT "login_audit_login_credential_id_fkey" FOREIGN KEY ("login_credential_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
