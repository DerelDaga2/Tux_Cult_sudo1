import fs from "fs";

export default async function handler(
    req,
    res
) {

    try {

        if (
            fs.existsSync(
                "token.json"
            )
        ) {

            fs.unlinkSync(
                "token.json"
            );
        }

        return res.status(200).json({

            success: true
        });

    } catch (error) {

        return res.status(500).json({

            error:
                error.message
        });
    }
}