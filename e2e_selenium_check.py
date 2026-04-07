import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class SrFixE2ETest(unittest.TestCase):

    def setUp(self):
        # Usamos SafariDriver que ya viene en tu Mac
        self.driver = webdriver.Safari()
        self.driver.maximize_window()
        self.wait = WebDriverWait(self.driver, 10)
        self.base_url = "http://localhost:3000" # Ajusta si tu puerto es 3005

    def test_01_landing_and_login_fail(self):
        """Prueba que la landing cargue y el login rechace basura"""
        driver = self.driver
        driver.get(f"{self.base_url}/login")
        
        print("🔍 Validando Login con credenciales inválidas...")
        email_input = self.wait.until(EC.presence_of_element_located((By.NAME, "email")))
        pass_input = driver.find_element(By.NAME, "password")
        
        email_input.send_keys("hacker@malicioso.com")
        pass_input.send_keys("123456")
        driver.find_element(By.TAG_NAME, "button").click()
        
        # Validar que el URL no cambie a /hub (significa que el AuthGuard bloqueó)
        time.sleep(2)
        self.assertIn("/login", driver.current_url)
        print("✅ Seguridad de Login: PASS")

    def test_02_portal_publico_lookup(self):
        """Prueba que el nuevo endpoint del Portal (C#) responda en la UI"""
        driver = self.driver
        # Usamos el slug 'demo' que inyectamos en el backend
        driver.get(f"{self.base_url}/portal?s=demo")
        
        print("🔍 Validando Portal Público (Backend Lookup)...")
        # Esperar a que el nombre de la tienda cargue desde el API
        shop_title = self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
        
        self.assertNotEqual(shop_title.text, "Portal de Cliente")
        print(f"✅ Portal cargó tienda: {shop_title.text} - PASS")

    def test_03_api_health_check(self):
        """Prueba que el fix de Inyección de Dependencias en /api/health funcione"""
        driver = self.driver
        backend_url = "http://localhost:5111/api/health" # Ajusta tu puerto de C#
        driver.get(backend_url)
        
        print("🔍 Validando Health Check del Backend...")
        body_text = driver.find_element(By.TAG_NAME, "body").text
        
        self.assertIn("Healthy", body_text)
        print("✅ Backend DI & Health: PASS")

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
