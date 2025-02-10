import nodemailer from "nodemailer";
import { config } from "./utils/config.ts";
import liquidjs from "liquidjs";

const emails = new liquidjs.Liquid({
    extname: '.liquid',
    root: './emails',
    jsTruthy: true
});

const templates: Record<string, {
    text: liquidjs.Template[],
    html: liquidjs.Template[]
}> = {};

const txt = (name: string) => `${name}.txt.liquid`
const html = (name: string) => `${name}.html.liquid`

const renderEmail = async (name: string, ctx: Record<string, any>) => {
    let tpls = templates[name];
    if (!tpls) {
        tpls = templates[name] = {
            text: await emails.parseFile(txt(name)),
            html: await emails.parseFile(html(name))
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
    type: 'verify-email' | 'room-invite',
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