from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

URL_BASE = "https://servicios-digitales-mx-frontend-web.vercel.app"
EMAIL_PRUEBA = f"robot_{int(time.time())}@taller.com"

def asalto_final():
    print(f"🚀 Lanzando asalto final a: {URL_BASE}")
    driver = webdriver.Chrome()
    driver.maximize_window()
    
    try:
        # FASE 1: REGISTRO
        print("📝 Fase 1: Creando cuenta en la interfaz azul...")
        driver.get(f"{URL_BASE}/register")
        wait = WebDriverWait(driver, 20)
        
        inputs = wait.until(EC.presence_of_all_elements_located((By.TAG_NAME, "input")))
        inputs[0].send_keys("Ejército de Jesús")
        inputs[1].send_keys(EMAIL_PRUEBA)
        inputs[2].send_keys("Password123!")
        
        print("🔘 Picando en 'Activar Acceso'...")
        driver.find_element(By.TAG_NAME, "button").click()
        
        # FASE 2: VERIFICACIÓN
        print("⏳ Esperando redirección al Panel Interno...")
        time.sleep(5) 
        
        if "/interno" in driver.current_url:
            print("🏆 ¡MISIÓN CUMPLIDA! El robot está dentro del panel.")
        else:
            print(f"⚠️ El robot sigue en: {driver.current_url}. Forzando entrada...")
            driver.get(f"{URL_BASE}/interno")
            time.sleep(5)

    except Exception as e:
        print(f"❌ El asalto falló: {e}")
    finally:
        input("Analiza el resultado en Chrome y presiona Enter...")
        driver.quit()

if __name__ == "__main__":
    asalto_final()
