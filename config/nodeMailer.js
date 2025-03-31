import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: '862d8c001@smtp-brevo.com',
        pass: 'RrwMTKEIazNv9HPB',
    }
})

export default transporter;