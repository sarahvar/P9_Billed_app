import { ROUTES_PATH } from '../constants/routes.js';
import { formatDate, formatStatus } from "../app/format.js";
import Logout from "./Logout.js";


export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    this.addEventListeners();
    new Logout({ document, localStorage, onNavigate });
  }

  addEventListeners() {
    const buttonNewBill = this.document.querySelector(`button[data-testid="btn-new-bill"]`);
    if (buttonNewBill) buttonNewBill.addEventListener('click', () => this.onNavigate(ROUTES_PATH['NewBill']));

    const iconEyes = this.document.querySelectorAll(`div[data-testid="icon-eye"]`);
    iconEyes.forEach(icon => {
      icon.addEventListener('click', () => this.handleClickIconEye(icon));
    });
  }

  handleClickIconEye(icon) {
    const billUrl = icon.getAttribute("data-bill-url");
    const imgWidth = Math.floor($('#modaleFile').width() * 0.5);

    // Mettez à jour le contenu de la modale avec la balise <img>
    $('#modaleFile').find(".modal-body").html(`
      <div style='text-align: center;' class="bill-proof-container">
        <img data-testid="billpicture" width=${imgWidth} src=${billUrl} alt="Bill" />
      </div>
    `);

    // Ajoutez un bouton de téléchargement PDF
    $('#modaleFile').find(".modal-body").append(`
      <div style='text-align: center; margin-top: 20px;'>
        <button id="downloadPdfButton" class="btn btn-primary">Télécharger en PDF</button>
      </div>
    `);

    // Ajoutez un gestionnaire d'événements pour le clic sur le bouton de téléchargement PDF
    $('#downloadPdfButton').on('click', () => this.downloadPdf(billUrl, 'nom-du-fichier.pdf'));

    // Afficher la modale
    $('#modaleFile').modal('show');
  }
// TELECHARGEMENT DU PDF
  downloadPdf(billUrl, pdfName) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = billUrl;

    img.onload = () => {
      const pdf = new jsPDF();
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(img, 'JPEG', 0, 0, width, height);
      pdf.save(pdfName);
    };
  }

  getBills() {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then(snapshot => {
          return snapshot.map(doc => {
            try {
              return {
                ...doc,
                date: doc.date,
                formatedDate: formatDate(doc.date),
                status: formatStatus(doc.status)
              }
            } catch(e) {
              console.log(e, 'for', doc);
              return {
                ...doc,
                date: doc.date,
                status: formatStatus(doc.status)
              }
            }
          });
        })
    }
  }
}
