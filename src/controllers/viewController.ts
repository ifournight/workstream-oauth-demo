import { renderFile } from 'ejs';
import { join } from 'path';

const viewsPath = join(process.cwd(), 'src', 'views');

export async function renderView(template: string, data: Record<string, any>): Promise<string> {
  try {
    const templatePath = join(viewsPath, `${template}.ejs`);
    const html = await renderFile(templatePath, data);
    return html as string;
  } catch (error) {
    console.error(`Error rendering template ${template}:`, error);
    throw error;
  }
}

