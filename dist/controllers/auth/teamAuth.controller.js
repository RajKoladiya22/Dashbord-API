"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeamMember = void 0;
const database_config_1 = require("../../config/database.config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const httpResponse_1 = require("../../core/utils/httpResponse");
const nodemailer_1 = __importDefault(require("nodemailer"));
const SMTP_USER = database_config_1.env.SMTP_USER || "magicallydev@gmail.com";
const SMTP_PASS = database_config_1.env.SMTP_PASS || "vkdd frwe seja frlb";
if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be set in environment variables.");
}
const mailtransport = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: "magicallydev@gmail.com",
        pass: "vkdd frwe seja frlb",
    },
});
const SALT_ROUNDS = parseInt((_a = database_config_1.env.SALT_ROUNDS) !== null && _a !== void 0 ? _a : "12", 10);
const createTeamMember = async (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        (0, httpResponse_1.sendErrorResponse)(res, 403, "Only admins can create team members.");
        return;
    }
    console.log("call createTeamMember---------");
    const { firstName, email, password, department, position, role, } = req.body;
    if (!["team_member", "sub_admin"].includes(role)) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Role must be 'team_member' or 'sub_admin'.");
        return;
    }
    try {
        const adminId = req.user.id;
        const [FN, ...rest] = firstName.trim().split(" ");
        const lastName = rest.join(" ") || "";
        const newMember = await database_config_1.prisma.$transaction(async (tx) => {
            const exists = await tx.teamMember.findUnique({
                where: { email: email.toLowerCase() },
            });
            const existsAny = await tx.loginCredential.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (exists || existsAny) {
                throw new Error("Email already in use.");
            }
            const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
            const member = await tx.teamMember.create({
                data: {
                    adminId,
                    firstName: FN,
                    lastName,
                    email: email.toLowerCase(),
                    passwordHash,
                    department,
                    position,
                    role,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    department: true,
                    position: true,
                    role: true,
                    createdAt: true,
                },
            });
            await tx.loginCredential.create({
                data: {
                    role,
                    email: member.email,
                    passwordHash,
                    userProfileId: member.id,
                    adminId,
                },
            });
            if (member) {
                const mailOptions = {
                    from: "magicallydev@gmail.com",
                    to: member.email,
                    subject: `Welcome to MagicallyDev, ${member.firstName}!`,
                    html: `
  <div style="background-color: #f6f8fa; padding: 60px 0; font-family: 'Helvetica Neue', sans-serif; color: #222;">
    <div style="max-width: 620px; margin: auto; background-color: #ffffff; border-radius: 12px; padding: 48px; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 35px;">
        <h1 style="margin: 0; font-size: 26px; color: #111;">👋 Welcome to the Team</h1>
        <p style="font-size: 15px; color: #555;">We’re excited to have you with us, ${member.firstName}!</p>
      </div>

      <!-- Body -->
      <p style="font-size: 15px; line-height: 1.6;">
        Your account has been created. Below are your login credentials. Please log in as soon as possible and remember to update your password.
      </p>

      <!-- Account Details -->
      <div style="background-color: #f9fafa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="margin: 8px 0;"><strong>Full Name:</strong> ${member.firstName} ${member.lastName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${member.email}</p>
        <p style="margin: 8px 0;"><strong>Temporary Password:</strong> ${password}</p>
      </div>

      <!-- Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://dashbord-seven-sigma.vercel.app/auth/signin" style="background-color: #000000; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Login to Your Account
        </a>
      </div>

      <!-- Footer -->
      <p style="font-size: 14px; color: #666; line-height: 1.5;">
        If you need help or have questions, don’t hesitate to contact your team lead or our support desk.
      </p>

      <p style="margin-top: 40px; font-size: 14px;">
        Welcome once again, and let’s build something magical!<br>
        <strong style="color: #000;">— The MagicallyDev Admin Team</strong>
      </p>
    </div>
  </div>
  `,
                };
                mailtransport.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Email sending failed...", error);
                    }
                    else {
                        console.log("Email sent successfully...", info.response);
                    }
                });
            }
            return member;
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 201, "Team member created successfully.", {
            teamMember: newMember,
        });
    }
    catch (err) {
        console.error("createTeamMember error:", err);
        if (err.message === "Email already in use.") {
            (0, httpResponse_1.sendErrorResponse)(res, 409, err.message);
        }
        else {
            (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        }
    }
};
exports.createTeamMember = createTeamMember;
//# sourceMappingURL=teamAuth.controller.js.map