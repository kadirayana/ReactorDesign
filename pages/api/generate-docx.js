import { buffer } from 'stream/consumers';
import HTMLToDOCX from 'html-to-docx';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // allow larger payload if page is big
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { html } = req.body;
    if (!html) return res.status(400).json({ error: 'Missing html in body' });

    // html-to-docx returns a Buffer
    const fileBuffer = await HTMLToDOCX(html, null, {
      table: { row: { cantSplit: true } },
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=cv.docx');
    res.send(fileBuffer);
  } catch (err) {
    console.error('Error generating docx:', err);
    res.status(500).json({ error: 'Failed to generate docx' });
  }
}
