import { NextRequest, NextResponse } from "next/server"
import { S3Client } from "@aws-sdk/client-s3"
import { createPresignedPost } from "@aws-sdk/s3-presigned-post"

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, folder } = await request.json()
    const bucket = process.env.AWS_S3_BUCKET as string
    const region = process.env.AWS_S3_REGION as string
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID as string
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY as string
    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: 'S3 non configuré' }, { status: 500 })
    }

    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } })
    const key = `${folder || 'chat'}/${Date.now()}-${encodeURIComponent(fileName)}`

    const { url, fields } = await createPresignedPost(s3, {
      Bucket: bucket,
      Key: key,
      Conditions: [["content-length-range", 0, 5 * 1024 * 1024]],
      Fields: { 'Content-Type': fileType },
      Expires: 60,
    })

    return NextResponse.json({ url, fields, key })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


