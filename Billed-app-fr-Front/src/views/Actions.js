import eyeBlueIcon from "../assets/svg/eye_blue.js"
import downloadBlueIcon from "../assets/svg/download_blue.js"

export const downloadPdf = (pdfUrl, pdfName) => {
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.target = '_blank';
  link.download = pdfName;
  link.click();
};

export default (billUrl) => {
  return (
    `<div class="icon-actions">
      <div id="eye" data-testid="icon-eye" data-bill-url=${billUrl}>
        ${eyeBlueIcon}
      </div>
      <div id="download" data-testid="icon-download" data-bill-url=${billUrl}>
        ${downloadBlueIcon}
      </div>
    </div>`
  );
};

