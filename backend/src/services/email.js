import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const ses = new SESv2Client({ region: process.env.AWS_REGION });

export async function sendEmail({ to, subject, body }) {
    const command = new SendEmailCommand({
        FromEmailAddress: process.env.SES_FROM_EMAIL,
        Destination: {
            ToAddresses: Array.isArray(to) ? to : [to],
        },
        Content: {
            Simple: {
                Subject: { Data: subject },
                Body:    { Text: { Data: body } },
            },
        },
    });

    return ses.send(command);
}