import { renderFile } from 'ejs';
import { join } from 'path';

const viewsPath = join(process.cwd(), 'src', 'views');

export async function renderView(template: string, data: Record<string, any>): Promise<string> {
  const templatePath = join(viewsPath, `${template}.ejs`);
  return renderFile(templatePath, data);
}

