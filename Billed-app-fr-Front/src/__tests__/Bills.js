/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom/extend-expect'
$.fn.modal = jest.fn() 
import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import { ROUTES } from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorageMock.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import ErrorPage from "../views/ErrorPage.js";
import { downloadPdf } from "../containers/Bills.js"
// Mock du magasin pour les tests
jest.mock("../app/store", () => mockStore);

// Configuration initiale avant tous les tests
beforeAll(() => {
  // Définition de la propriété localStorage sur l'objet window pour les tests
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });

  // Configuration d'un utilisateur connecté de type "Employee" dans le localStorage
  window.localStorage.setItem('user', JSON.stringify({
    "type": "Employee",
    "email": "employee@test.tld",
    "status": "connected"
  }));
});

// Configuration exécutée après chaque test pour effacer les mocks
afterEach(() => {
  jest.clearAllMocks();
});

// Suite de tests principale : Utilisateur connecté en tant qu'employé
describe("Given I am connected as an employee", () => {

  // Contexte : Navigation sur la page des factures
  describe("When I am on Bills Page", () => {

    // Test : L'icône de la facture dans la disposition verticale doit être mise en surbrillance
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Création d'un élément racine simulé
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      // Configuration du routeur
      router();

      // Déclenchement de la navigation vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills);

      // Attente que l'icône de la fenêtre soit présente dans le DOM
      await waitFor(() => screen.getByTestId('icon-window'));

      // Vérification que l'icône de la fenêtre a la classe "active-icon"
      const windowIcon = screen.getByTestId('icon-window');
      expect(windowIcon).toHaveClass("active-icon");
    });

    // Contexte : Clic sur le bouton de nouvelle facture
    describe("When I click on the new bill button", () => {

      // Test : La page Nouvelle Facture doit être rendue
      test("Then it should render New Bill page", async () => {
        // Sélection du bouton de nouvelle facture et déclenchement du clic
        const newBillBtn = screen.getByTestId("btn-new-bill");
        userEvent.click(newBillBtn);

        // Attente que le titre de la page soit visible dans le DOM
        const pageTitle = await screen.findByText("Envoyer une note de frais");
        expect(pageTitle).toBeVisible();
      });
    });

    // Test : Les factures doivent être triées de la plus ancienne à la plus récente
    test("Then bills should be ordered from earliest to latest", () => {
      // Insertion du HTML simulé de l'interface utilisateur des factures avec des données simulées
      document.body.innerHTML = BillsUI({ data: bills });

      // Extraction des dates de l'interface utilisateur et tri anti-chronologique
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);

      // Vérification que les dates dans l'interface utilisateur sont égales aux dates triées
      expect(dates).toEqual(datesSorted);
    });
    
    // Contexte : Appel de la méthode getBills
    describe("When I am calling getBills method", () => {

      // Test : Elle doit retourner des factures mappées avec des dates et des statuts formatés
      test("Then it should return mapped bills with formatted date and status", async () => {
        // Création d'une instance de la classe Bills avec des options simulées
        const bills = new Bills({ document, onNavigate, store: mockStore, localStorage });

        // Appel de la méthode getBills et récupération des factures formatées
        const formattedBills = await bills.getBills();

        // Vérifications des propriétés de la première facture
        expect(formattedBills[0].formatedDate).toBe("4 Avr. 04");
        expect(formattedBills[0].status).toBe("En attente");

        // Vérifications des propriétés de la deuxième facture
        expect(formattedBills[1].formatedDate).toBe("1 Jan. 01");
        expect(formattedBills[1].status).toBe("Refused");

        // Vérifications des propriétés de la troisième facture
        expect(formattedBills[2].formatedDate).toBe("3 Mar. 03");
        expect(formattedBills[2].status).toBe("Accepté");

        // Vérifications des propriétés de la quatrième facture
        expect(formattedBills[3].formatedDate).toBe("2 Fév. 02");
        expect(formattedBills[3].status).toBe("Refused");
      });

      // Test : Elle doit retourner des factures mappées avec des statuts formatés et des dates non modifiées
      test("Then it should return mapped bills with formatted status and untouched date", async () => {
        // Liste simulée de factures avec une date incorrecte
        const resolvedBillsList= [{
          "id": "43225ddsf6fIm2zOKkLzMro",
          "status": "pending",
          "date": "wrong_date_example"
        }];
  
        // Espionner la méthode list du magasin et la faire renvoyer la liste simulée
        jest.spyOn(mockStore.bills(), "list").mockResolvedValueOnce(resolvedBillsList);
    
        // Création d'une instance de la classe Bills avec des options simulées
        const bills = new Bills({ document, onNavigate, store: mockStore, localStorage });

        // Appel de la méthode getBills et récupération des factures formatées
        const formattedBills = await bills.getBills();

        // Vérifications de l'appel à la méthode list du magasin
        expect(mockStore.bills().list).toBeCalled();

        // Vérifications des propriétés de la première facture dans la liste simulée
        expect(formattedBills[0].date).toBe("wrong_date_example");
        expect(formattedBills[0].status).toBe("En attente");
      });
    });

    // Contexte : Clic sur l'icône "eye"
    describe("When I click on the icon eye", () => {

      // Test : Une modal doit s'ouvrir
      test("Then a modal should open", async () => {
        // Fonction de navigation simulée qui met à jour le corps du document avec une nouvelle route
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        // Création d'une instance de la classe Bills avec des options simulées
        new Bills({ document, onNavigate, store: mockStore, localStorage });

        // Sélection de toutes les icônes "eye" et clic sur la première
        const eyesIcons = screen.getAllByTestId("icon-eye");
        const firstEyesIcon = eyesIcons[0];
        userEvent.click(firstEyesIcon);

        // Attente que la modal soit visible dans le DOM
        const dialog = await screen.findByRole("dialog", {hidden:true});
        expect(dialog).toBeVisible();
      });
    });
    
    // TEST D'INTEGRATION GET

    // Contexte : Récupération des données des factures depuis l'API
    describe("When bills are being fetched from Api", () => {  

      // Configuration avant tous les tests : Espionner la méthode list du magasin
      beforeAll(() => {
        jest.spyOn(mockStore.bills(), "list");
      });
    
      // Configuration avant chaque test
      beforeEach(() => {
        // Configuration locale pour simuler un utilisateur connecté de type "Employee"
        localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
        
        // Création d'un élément racine simulé dans le corps du document
        const root = '<div id="root"></div>';
        document.body.innerHTML = root;
        
        // Configuration de l'application pour simuler la navigation
        router();
      });
    
      // Test : Les données des factures doivent être retournées et affichées
      test("Then bills data should be returned and displayed", async () => {
        // Déclencher la navigation vers la page des factures
        window.onNavigate(ROUTES_PATH.Bills);
    
        // Attendre que la méthode list du magasin soit appelée
        await waitFor(() => {
          expect(mockStore.bills().list).toHaveBeenCalled();
          // Vérifier le nombre d'éléments de ligne dans le tableau des factures
          expect(document.querySelectorAll("tbody tr").length).toBe(4);
    
          // Vérifier la présence de certains textes spécifiques dans le tableau des factures
          expect(screen.getByText("encore")).toBeTruthy();
          expect(screen.getByText("test1")).toBeTruthy();
          expect(screen.getByText("test2")).toBeTruthy();
          expect(screen.getByText("test3")).toBeTruthy();
        });
      });
    
      // Contexte : Erreur lors de la récupération depuis l'API
      describe("When an error occurs on api", () => {
        
        // Test : La récupération doit échouer avec un message d'erreur 500 affiché dans le DOM
        test("Then fetch should fail with a 500 message error displayed to the DOM", async () => {
          // Création d'une erreur simulée avec un message "Erreur 500"
          const authErrorMock = new Error("Erreur 500");
          
          // Espionner la méthode list du magasin et la faire renvoyer une erreur simulée
          jest.spyOn(mockStore.bills(), "list").mockRejectedValueOnce(authErrorMock);
      
          // Déclencher la navigation vers la page des factures
          window.onNavigate(ROUTES_PATH.Bills);
      
          // Attendre que le message d'erreur 500 soit affiché dans le DOM
          await waitFor(() => {
            expect(screen.getByText(/Erreur 500/)).toBeTruthy();
            // Vérifier que le rendu du corps du document correspond à un instantané d'erreur
            expect(document.body).toMatchSnapshot(ErrorPage(authErrorMock));
          });
        });
      
        // Test : La récupération doit échouer avec un message d'erreur 401 affiché dans le DOM
        test("Then fetch should fail with a 401 message error displayed to the DOM", async () => {
          // Création d'une erreur simulée avec un message "Erreur 401"
          const authErrorMock = new Error("Erreur 401");
          
          // Espionner la méthode list du magasin et la faire renvoyer une erreur simulée
          jest.spyOn(mockStore.bills(), "list").mockRejectedValueOnce(authErrorMock);
      
          // Déclencher la navigation vers la page des factures
          window.onNavigate(ROUTES_PATH.Bills);
      
          // Attendre que le message d'erreur 401 soit affiché dans le DOM
          await waitFor(() => {
            expect(screen.getByText(/Erreur 401/)).toBeTruthy();
            // Vérifier que le rendu du corps du document correspond à un instantané d'erreur
            expect(document.body).toMatchSnapshot(ErrorPage(authErrorMock));
          });
        });
      
        // Test : La récupération doit échouer avec un message d'erreur 404 affiché dans le DOM
        test("Then fetch should fail with a 404 message error displayed to the DOM", async () => {
          // Création d'une erreur simulée avec un message "Erreur 404"
          const authErrorMock = new Error("Erreur 404");
          
          // Espionner la méthode list du magasin et la faire renvoyer une erreur simulée
          jest.spyOn(mockStore.bills(), "list").mockRejectedValueOnce(authErrorMock);
      
          // Déclencher la navigation vers la page des factures
          window.onNavigate(ROUTES_PATH.Bills);
      
          // Attendre que le message d'erreur 404 soit affiché dans le DOM
          await waitFor(() => {
            expect(screen.getByText(/Erreur 404/)).toBeTruthy();
            // Vérifier que le rendu du corps du document correspond à un instantané d'erreur
            expect(document.body).toMatchSnapshot(ErrorPage(authErrorMock));
          });
        });
      });
    });
  });
});

