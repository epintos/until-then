import { NextResponse } from "next/server";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_API_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

export async function POST(request: Request) {
  try {
    const { encryptedContent, sender, timestamp } = await request.json();

    if (!encryptedContent) {
      return NextResponse.json({ error: "No encrypted content provided" }, { status: 400 });
    }

    const jsonContent = JSON.stringify({ encryptedContent, sender, timestamp });

    const file = new File([jsonContent], `${timestamp}-${sender}.json]`, {
      type: "application/json",
    });

    const result = await pinata.upload.private.file(file);

    await pinata.groups.private.addFiles({
      groupId: process.env.PINATA_PUBLIC_GROUP_ID!,
      files: [
        result.id
      ],
    });

    return NextResponse.json({ cid: result.cid }, { status: 200 });
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    return NextResponse.json({ error: "Failed to upload content to Pinata" }, { status: 500 });
  }
} 
