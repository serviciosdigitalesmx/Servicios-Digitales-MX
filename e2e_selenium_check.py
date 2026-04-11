import os
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from selenium import webdriver
from selenium.webdriver import SafariOptions
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def build_driver():
    browser = os.getenv("SELENIUM_BROWSER", "chrome").strip().lower()

    if browser == "safari":
        return webdriver.Safari(options=SafariOptions())

    options = ChromeOptions()
    if os.getenv("SELENIUM_HEADLESS", "1") != "0":
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1100")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    return webdriver.Chrome(options=options)


class ServiciosDigitalesMxE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_url = os.getenv("E2E_BASE_URL", "http://localhost:3005").rstrip("/")
        cls.backend_url = os.getenv("E2E_BACKEND_URL", "http://localhost:5115").rstrip("/")

    def setUp(self):
        self.driver = build_driver()
        self.wait = WebDriverWait(self.driver, 12)

    def tearDown(self):
        self.driver.quit()

    def test_01_login_redirects_to_hub(self):
        driver = self.driver
        driver.get(f"{self.base_url}/login")

        email_input = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

        email_input.clear()
        email_input.send_keys("qa-local@serviciosdigitales.mx")
        password_input.clear()
        password_input.send_keys("prueba-local-123")
        submit_button.click()

        self.wait.until(EC.url_contains("/hub"))
        header = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "main h2"))
        )
        self.assertIn("/hub", driver.current_url)
        self.assertEqual(header.text.strip().upper(), "RESUMEN")

    def test_02_hub_technical_panel_opens_modal(self):
        driver = self.driver
        driver.get(f"{self.base_url}/hub")

        tecnico_button = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Técnico')]"))
        )
        tecnico_button.click()

        detail_button = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Ver detalles')]"))
        )
        detail_button.click()

        modal_title = self.wait.until(
            EC.visibility_of_element_located((By.XPATH, "//h3[starts-with(normalize-space(), 'SR-')]"))
        )
        save_button = self.wait.until(
            EC.visibility_of_element_located((By.XPATH, "//button[contains(., 'Guardar Cambios')]"))
        )

        self.assertTrue(modal_title.text.startswith("SR-"))
        self.assertTrue(save_button.is_displayed())

    def test_03_public_portal_can_lookup_order(self):
        driver = self.driver
        driver.get(f"{self.base_url}/portal?s=demo")

        brand_title = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "nav h1"))
        )
        self.assertIn("SR. FIX CENTRAL", brand_title.text.upper())

        folio_input = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "input[placeholder*='ORD-000123']"))
        )
        folio_input.clear()
        folio_input.send_keys("ord-000123")
        folio_input.send_keys(Keys.ENTER)

        folio_badge = self.wait.until(
            EC.visibility_of_element_located((By.XPATH, "//*[contains(normalize-space(), 'Folio ORD-000123')]"))
        )
        self.assertIn("ORD-000123", folio_badge.text)

    def test_04_backend_health_endpoint_is_healthy(self):
        response = urlopen(f"{self.backend_url}/api/health", timeout=10)
        payload = response.read().decode("utf-8")
        self.assertIn("Healthy", payload)

    def test_05_hub_mobile_keeps_navigation_visible(self):
        driver = self.driver
        driver.set_window_size(390, 844)
        driver.get(f"{self.base_url}/hub")

        sidebar = self.wait.until(
            EC.visibility_of_element_located((By.TAG_NAME, "aside"))
        )
        self.assertTrue(sidebar.is_displayed())


class BackendContractChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.backend_url = os.getenv("E2E_BACKEND_URL", "http://localhost:5115").rstrip("/")

    def test_06_webhook_endpoint_currently_missing_or_protected(self):
        request = Request(
            f"{self.backend_url}/api/webhooks/mercadopago",
            data=b'{"id":123}',
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            response = urlopen(request, timeout=10)
            status = response.status
        except HTTPError as error:
            status = error.code
        except URLError as error:
            self.fail(f"No se pudo contactar el backend para validar webhook: {error}")

        self.assertIn(status, {401, 404})


if __name__ == "__main__":
    unittest.main(verbosity=2)
