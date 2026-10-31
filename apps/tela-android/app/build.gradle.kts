plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Número da execução do GitHub Actions = versão do app (cada build novo instala por cima do anterior).
val numeroBuild = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
val keystore: String? = System.getenv("TELA_KEYSTORE_FILE")

android {
    namespace = "br.com.examidia.tela"
    compileSdk = 34

    defaultConfig {
        applicationId = "br.com.examidia.tela"
        minSdk = 21
        targetSdk = 34
        versionCode = numeroBuild
        versionName = "1.0.$numeroBuild"
        buildConfigField("String", "URL_TELA", "\"https://examidia.com.br/tela/\"")
    }

    signingConfigs {
        create("release") {
            if (keystore != null) {
                storeFile = file(keystore)
                storePassword = System.getenv("TELA_KEYSTORE_PASS")
                keyAlias = System.getenv("TELA_KEY_ALIAS")
                keyPassword = System.getenv("TELA_KEY_PASS")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (keystore != null) signingConfigs.getByName("release") else signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { buildConfig = true }
    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
}
