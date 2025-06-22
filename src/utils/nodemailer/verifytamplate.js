export const verifyAccountTamplate = (name,token)=>{
    return `<div style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
            <div style="border-top: 5px solid green; padding: 10px 0; text-align: center;">
              <p>Dear ${name},</p>
              <p>Notification from XBX!</p>
            </div>

            <h2 style="text-align: center; color: #333;">Welcome! I hope to find what you want </h2>

            <p style="line-height: 1.6;">Thank you for choosing XBX!</p>
            <p>Best regards,<br>The XBX Team</p>

            <div style="border-bottom: 5px solid green; padding: 10px 0;"></div>
          </div>
        </div>`
}