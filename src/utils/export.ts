import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type ExportFormat = 'txt' | 'md' | 'html';

export async function exportText(content: string, title: string, format: ExportFormat = 'txt') {
  try {
    let formattedContent = content;
    let fileName = `${title}.${format}`;
    let mimeType = 'text/plain';

    switch (format) {
      case 'md':
        mimeType = 'text/markdown';
        break;
      case 'html':
        formattedContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
  </style>
</head>
<body>
  ${content.split('\n').map(line => `<p>${line}</p>`).join('\n')}
</body>
</html>`;
        mimeType = 'text/html';
        break;
    }

    const path = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(path, formattedContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType,
        dialogTitle: `${title} olarak dışa aktar`,
      });
    } else {
      throw new Error('Paylaşım özelliği bu cihazda kullanılamıyor.');
    }
  } catch (error) {
    console.error('Dışa aktarma hatası:', error);
    throw error;
  }
}

export async function exportProject(project: {
  title: string;
  content: string;
  characters: any[];
  plotPoints: any[];
  worldElements: any[];
}) {
  try {
    const content = `# ${project.title}

## İçerik
${project.content}

## Karakterler
${project.characters.map(char => `
### ${char.name}
${char.description}
`).join('\n')}

## Olay Örgüsü
${project.plotPoints.map(point => `
### ${point.title}
${point.description}
`).join('\n')}

## Dünya Öğeleri
${project.worldElements.map(element => `
### ${element.name}
${element.description}
`).join('\n')}
`;

    await exportText(content, project.title, 'md');
  } catch (error) {
    console.error('Proje dışa aktarma hatası:', error);
    throw error;
  }
} 