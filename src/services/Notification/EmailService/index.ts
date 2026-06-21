// services/notification/EmailService.ts
import nodemailer from "nodemailer";
import { nodemailerConfig } from "@/config/verifyCode";

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: nodemailerConfig.host,
      port: nodemailerConfig.port,
      secure: nodemailerConfig.secure,
      auth: {
        user: nodemailerConfig.auth.user,
        pass: nodemailerConfig.auth.pass,
      },
    });
  }

  async sendVerificationEmail(
    to: string,
    code: string,
    subject: string = "邮箱验证码",
  ): Promise<void> {
    const mailOptions = {
      from: `"星语智能助手" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>星语 邮箱验证</h2>
                <p>您的验证码是：</p>
                <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${code}</h1>
                <p>验证码将在 <strong>5分钟</strong> 后过期，请尽快完成验证。</p>
                <p>如果这不是您的操作，请忽略此邮件。</p>
                </div>
            `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error: any) {
      console.error("📧 邮件发送失败详情:", error.message || error);
      throw new Error("邮件发送失败，请稍后重试");
    }
  }
}

export default new EmailService();
