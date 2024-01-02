/**
 * @jest-environment jsdom
 */

// Import des fonctions de Jest pour le testing du DOM
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";

// Import des composants et modules nécessaires pour les tests
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorageMock.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

// Mockez les données du store avec la fonction mock() de Jest
jest.mock("../app/Store", () => mockStore);

// Début du bloc de tests Jest
describe("Given I am connected as an employee", () => {
  
  describe("When I am on NewBill Page", () => {
    
    // Test : Vérifier que l'icône du courrier dans la mise en page verticale est mise en surbrillance
    test("Then icon of mail in the vertical Layout must be highlighted", async () => {
      
      // Modification de l'objet window avec la méthode defineProperty pour simuler localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      
      // Simulation de la connexion d'un utilisateur avec le type "Employee"
      window.localStorage.setItem('user',  JSON.stringify({ type: 'Employee' }));

      // Création d'un élément div simulé avec l'id 'root'
      const rootElement = document.createElement('div');
      rootElement.setAttribute('id', 'root');
      document.body.append(rootElement);

      // Initialisation du router
      router();

      // Initialisation de la fonction onNavigate
      window.onNavigate(ROUTES_PATH.NewBill);

      // Attendre que l'icône du courrier soit présente dans le DOM
      await waitFor(() => screen.getByTestId('icon-mail'));

      // Vérification : l'écran doit avoir l'id icon-mail et contenir la classe .active-icon
      const emailIcon = screen.getByTestId('icon-mail');
      expect(emailIcon).toBeTruthy();
      expect(screen.getByTestId('icon-mail').classList.contains('active-icon')).toBeTruthy();
    });

    // Test : Vérifier que les champs du formulaire sont affichés sur la page Web
    test("Then the inputs forms should be displayed on the web page", () => {
      document.body.innerHTML = NewBillUI();

      // Ciblage des éléments du DOM par leur attribut data-testid
      const expenseTypeField = screen.getByTestId('expense-type');
      expect(expenseTypeField).toBeDefined();
      expect(expenseTypeField).toBeTruthy();

      const expenseNameField = screen.getByTestId('expense-name');
      expect(expenseNameField).toBeDefined();
      expect(expenseNameField).toBeTruthy();

      const datePickerField = screen.getByTestId('datepicker');
      expect(datePickerField).toBeDefined();
      expect(datePickerField).toBeTruthy();
    });
  }); 

  // TEST D'INTEGRATION POST
  describe("When I am on the newBill page, I fill the form and submit", () => {
    
    // Test : Vérifier que la nouvelle facture est ajoutée via l'API POST
    test("Then the new bill should be added to the API POST", async() => {
      
      // Affichage de l'interface utilisateur de la nouvelle facture
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Initialisation d'une nouvelle facture factice - Document
      const dummyBill = {
        "id": "qcCK3SzECmaZAGRrHjaC",
        "status": "refused",
        "pct": 20,
        "amount": 200,
        "email": "a@a",
        "name": "test2",
        "vat": "40",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2002-02-02",
        "commentAdmin": "pas la bonne facture",
        "commentary": "test2",
        "type": "Restaurants et bars",
        "fileUrl": "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a"
       
      };

      // Ciblage de chaque champ d'entrée du formulaire & simulation du changement avec fireEvent
      const expenseTypeField = screen.getByTestId('expense-type');
      fireEvent.change(expenseTypeField, {target: {value: dummyBill.type} });
      expect(expenseTypeField.value).toBe(dummyBill.type);

      const expenseNameField = screen.getByTestId('expense-name');
      fireEvent.change(expenseNameField, {target: {value: dummyBill.name} });
      expect(expenseNameField.value).toBe(dummyBill.name);

      const datePickerField = screen.getByTestId('datepicker');
      fireEvent.change(datePickerField, {target: {value: dummyBill.date} });
      expect(datePickerField.value).toBe(dummyBill.date);

      const amountField = screen.getByTestId('amount');
      fireEvent.change(amountField, {target: {value: dummyBill.amount} });
      expect(parseInt(amountField.value)).toBe(parseInt(dummyBill.amount));

      const vatField = screen.getByTestId('vat');
      fireEvent.change(vatField, {target: {value: dummyBill.vat} });
      expect(parseInt(vatField.value)).toBe(parseInt(dummyBill.vat));

      const pctField = screen.getByTestId('pct');
      fireEvent.change(pctField, {target: {value: dummyBill.pct} });
      expect(parseInt(pctField.value)).toBe(parseInt(dummyBill.pct));

      const commentaryField = screen.getByTestId('commentary');
      fireEvent.change(commentaryField, {target: {value: dummyBill.commentary} });
      expect(commentaryField.value).toBe(dummyBill.commentary);

      // Simulation de la soumission du formulaire
      const onNavigate = pathname => { document.body.innerHTML =  ROUTES({ pathname}); };
      const newBillForm = screen.getByTestId('form-new-bill');
      Object.defineProperty(window, 'localStorage', { value: localStorageMock});
      
      const newBillInstance = new NewBill({document, onNavigate, store: mockStore, localStorage: window.localStorage});

      // Mise en place d'un écouteur pour le changement de fichier
      const handleChangeFile = jest.fn(newBillInstance.handleChangeFile);
      newBillForm.addEventListener('change', handleChangeFile);

      // Simulation du changement de fichier
      const fileField = screen.getByTestId('file');
      fireEvent.change(fileField, {target: {files: [new File([dummyBill.fileName], dummyBill.fileUrl, {type: 'image/png'}) ] }});
      expect(fileField.files[0].name).toBe(dummyBill.fileUrl);
      expect(fileField.files[0].type).toBe('image/png');
      expect(handleChangeFile).toHaveBeenCalled();

      // Mise en place d'un écouteur pour la soumission du formulaire
      const handleSubmit = jest.fn(newBillInstance.handleSubmit);
      newBillForm.addEventListener("submit", handleSubmit);

      // Simulation de la soumission du formulaire
      fireEvent.submit(newBillForm);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
