function layout(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html lang="hu">
  <body style="margin:0;padding:0;background-color:#F7F2EA;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F2EA;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:480px;width:100%;">
            <tr>
              <td style="background-color:#4A102A;padding:24px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:36px;height:36px;background-color:#B89A62;border-radius:8px;text-align:center;vertical-align:middle;color:#ffffff;font-weight:bold;font-size:16px;">T</td>
                    <td style="padding-left:10px;color:#ffffff;font-size:15px;font-weight:600;">The Code</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#30252A;font-size:14px;line-height:1.6;">
                <h1 style="margin:0 0 16px;font-size:18px;color:#30252A;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:#B89A62;border-radius:8px;">
        <a href="${href}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

export function portalInviteEmail({ contactName, accountName, setupUrl }: { contactName: string; accountName: string; setupUrl: string }) {
  return layout(
    "Meghívó az ügyfélportálra",
    `<p>Szia ${contactName}!</p>
     <p>A The Code csapata létrehozta a <strong>${accountName}</strong> ügyfélportál-hozzáférésedet. A belépéshez először állíts be egy jelszót:</p>
     ${button(setupUrl, "Jelszó beállítása")}
     <p style="color:#70636a;font-size:12px;">Ha ezt nem te kérted, hagyd figyelmen kívül ezt az emailt.</p>`
  );
}

export function portalReadyEmail({ contactName, accountName, loginUrl }: { contactName: string; accountName: string; loginUrl: string }) {
  return layout(
    "Elkészült az ügyfélportálod",
    `<p>Szia ${contactName}!</p>
     <p>A The Code csapata létrehozta a <strong>${accountName}</strong> ügyfélportál-hozzáférésedet. A belépéshez a jelszavadat tőlünk kapod meg külön csatornán.</p>
     ${button(loginUrl, "Belépés az ügyfélportálra")}`
  );
}

export function staffInviteEmail({ name, setupUrl }: { name: string; setupUrl: string }) {
  return layout(
    "Meghívó a The Code CRM-be",
    `<p>Szia ${name}!</p>
     <p>Hozzáférést kaptál a The Code belső CRM rendszeréhez. A belépéshez állíts be egy jelszót:</p>
     ${button(setupUrl, "Jelszó beállítása")}`
  );
}

export function reportEmail({
  accountName,
  reportUrl,
  activeProjects,
  completedProjects,
  totalBudget,
}: {
  accountName: string;
  reportUrl: string;
  activeProjects: number;
  completedProjects: number;
  totalBudget: string;
}) {
  return layout(
    "Heti riport",
    `<p>Szia!</p>
     <p>Elkészült a <strong>${accountName}</strong> legutóbbi heti riportja:</p>
     <p style="color:#70636a;">Aktív projektek: ${activeProjects} · Lezárva: ${completedProjects} · Összbüdzsé: ${totalBudget}</p>
     ${button(reportUrl, "Riport megnyitása")}`
  );
}
