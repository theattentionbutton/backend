import nodemailer from "nodemailer";
import { config } from "./utils/config";
import { Liquid, Template } from "liquidjs";

const emails = new Liquid({
    extname: '.liquid',
    root: './emails',
    jsTruthy: true
});

const templates: Record<string, {
    text: Template[],
    html: Template[]
}> = {};

const renderEmail = async (name: string, ctx: Record<string, any>) => {
    let tpls = templates[name];
    if (!tpls) {
        tpls = templates[name] = {
            text: await emails.parseFile(name + '.txt'),
            html: await emails.parseFile(name + '.html')
        }
    }
    return {
        html: await emails.render(tpls.html, ctx),
        text: await emails.render(tpls.text, ctx)
    }
}

const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
        user: config.smtpUsername,
        pass: config.smtpPassword
    }
})

const MAIL_FROM = {
    name: 'The Attention Button',
    address: 'contact@theattentionbutton.in'
}

interface SendEmailOpts {
    to: string,
    subject: string,
    type: 'verify-email',
    ctx: Record<string, any>,
}
export const sendEmail = async (opts: SendEmailOpts) => {
    const rendered = await renderEmail(opts.type, opts.ctx);
    await transporter.sendMail({
        from: MAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        html: rendered.html,
        text: rendered.text,
    })
}