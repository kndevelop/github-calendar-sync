const { google } = require("googleapis");

const body = process.env.ISSUE_BODY;
const title = process.env.ISSUE_TITLE;

// 例
// 開始:2026-08-01 19:00
// 終了:2026-08-01 21:00

const startMatch = body.match(/開始:(.+)/);
const endMatch = body.match(/終了:(.+)/);

if (!startMatch || !endMatch) {
    console.log("開始・終了日時が見つかりません");
    process.exit(1);
}

const start = startMatch[1].trim().replace(" ", "T") + ":00+09:00";
const end = endMatch[1].trim().replace(" ", "T") + ":00+09:00";

async function createEvent() {

    // Workload Identity Federationで認証
    const auth = new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/calendar"]
    });

    const authClient = await auth.getClient();

    const calendar = google.calendar({
        version: "v3",
        auth: authClient
    });

    const event = {
        summary: title,
        description: body,
        start: {
            dateTime: start
        },
        end: {
            dateTime: end
        }
    };

    const res = await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        requestBody: event
    });

    console.log("イベントを作成しました");
    console.log(res.data.htmlLink);
}

createEvent().catch(err => {
    console.error(err);
    process.exit(1);
});
