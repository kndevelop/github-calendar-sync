const { google } = require("googleapis");

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  ["https://www.googleapis.com/auth/calendar"]
);

const calendar = google.calendar({
  version: "v3",
  auth,
});

/**
 * Issue Formsの値を取得
 */
function getValue(body, label) {
  const regex = new RegExp(
    `### ${label}\\s*\\n\\s*([\\s\\S]*?)(?=\\n### |$)`
  );

  const match = body.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * 所要時間→分へ変換
 */
const durationMap = {
  "15分": 15,
  "30分": 30,
  "1時間": 60,
  "2時間": 120,
  "3時間": 180,
  "半日": 240,
  "1日": 480,
};

(async () => {
  try {
    const body = process.env.ISSUE_BODY;

    const title = getValue(body, "タスク名");
    const startDateTime = getValue(body, "開始日時");
    const duration = getValue(body, "所要時間");
    const memo = getValue(body, "詳細");

    if (!title) throw new Error("タスク名がありません");
    if (!startDateTime) throw new Error("開始日時がありません");
    if (!durationMap[duration]) throw new Error(`所要時間が不正です: ${duration}`);

    // 開始日時
    const start = new Date(
      startDateTime.replace(" ", "T") + ":00+09:00"
    );

    // 終了日時
    const end = new Date(
      start.getTime() + durationMap[duration] * 60 * 1000
    );

    console.log("タイトル:", title);
    console.log("開始:", start);
    console.log("終了:", end);

    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: title,
        description: `優先度: ${memo}`,
        start: {
          dateTime: start.toISOString(),
          timeZone: "Asia/Tokyo",
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: "Asia/Tokyo",
        },
      },
    });

    console.log("イベント作成成功");
    console.log(event.data.htmlLink);
    console.log("Event ID:", event.data.id);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
