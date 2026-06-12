import type { Locale } from "@/lib/i18n";

type NavItem = {
  href: string;
  label: string;
};

type HomeModel = {
  name: string;
  description: string;
  image?: string;
  real?: boolean;
};

type GalleryItem = {
  title: string;
  src: string;
};

type Dictionary = {
  header: {
    leftNavItems: NavItem[];
    rightNavItems: NavItem[];
    languageLabel: string;
  };
  footer: {
    lineOne: string;
    lineTwo: string;
  };
  home: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    heroModelName: string;
    heroModelDescription: string;
    signatureEyebrow: string;
    signatureTitle: string;
    signatureNote: string;
    models: HomeModel[];
    realModelLabel: string;
    realModelNote: string;
    placeholderNote: string;
  };
  about: {
    hero: {
      eyebrow: string;
      title: string;
      description: string;
    };
    origin: {
      eyebrow: string;
      title: string;
      description: string;
    };
    philosophy: {
      eyebrow: string;
      title: string;
      description: string;
    };
  };
  gallery: {
    hero: {
      eyebrow: string;
      title: string;
      description: string;
    };
    itemNote: string;
    items: GalleryItem[];
  };
  contact: {
    hero: {
      eyebrow: string;
      title: string;
      description: string;
    };
    form: {
      name: string;
      email: string;
      message: string;
      namePlaceholder: string;
      emailPlaceholder: string;
      messagePlaceholder: string;
      button: string;
    };
    details: {
      eyebrow: string;
      title: string;
      lines: string[];
    };
  };
  shop: {
    hero: {
      eyebrow: string;
      title: string;
      description: string;
    };
    previewEyebrow: string;
    previewTitle: string;
    previewDescription: string;
    modulesTitle: string;
    modules: string[];
    cta: string;
  };
};

const sharedGalleryImages = [
  "/models/soak/DSC05613.JPG",
  "/models/soak/DSC05618.JPG",
  "/models/soak/DSC05617.JPG",
  "/models/soak/DSC05621.JPG",
  "/models/soak/DSC05614.JPG",
  "/models/soak/DSC05615.JPG"
];

const dictionaries: Record<Locale, Dictionary> = {
  pl: {
    header: {
      leftNavItems: [
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" }
      ],
      rightNavItems: [
        { href: "/gallery", label: "Gallery" },
        { href: "/configurator", label: "Konfigurator" }
      ],
      languageLabel: "Język"
    },
    footer: {
      lineOne: "Gitary WEIRDO. Modułowa konstrukcja. Rzemiosło premium.",
      lineTwo: "Zaprojektowane do zmian, stworzone dla scenicznej obecności."
    },
    home: {
      eyebrow: "Modułowe instrumenty premium",
      title: "Zaprojektowane tak, by ewoluowały razem z artystą.",
      description:
        "WEIRDO to koncepcyjna marka premium skupiona na wyrazistych sylwetkach, precyzyjnym wykonaniu i modularnej platformie, która zmienia się wraz z kolejnymi etapami Twojego brzmienia.",
      primaryCta: "Zobacz galerię",
      secondaryCta: "Zbuduj swoją gitarę",
      heroModelName: "Model SOAK",
      heroModelDescription:
        "Pierwszy sfotografowany koncept dodany bezpośrednio z lokalnego folderu projektu.",
      signatureEyebrow: "Sygnowane koncepty",
      signatureTitle: "Wczesne modele zaprojektowane z myślą o scenicznej obecności.",
      signatureNote:
        "Pierwsza karta wykorzystuje realne zdjęcie modelu, a pozostałe placeholdery są gotowe do łatwej podmiany.",
      models: [
        {
          name: "Model SOAK",
          image: "/models/soak/DSC05618.JPG",
          real: true,
          description:
            "Ręcznie wykończony instrument koncepcyjny o rzeźbionej linii, ciemnym usłojeniu i czerwono-czarnym, premium wykończeniu."
        },
        {
          name: "Monolith Gold",
          description:
            "Jednocięty model o mocnej prezencji z wymiennymi topami i charakterem ustawionym pod długi, filmowy sustain."
        },
        {
          name: "Spectra Void",
          description:
            "Nowoczesny model performance z platformą do szybkiej wymiany pickupów, profili gryfu i układu sterowania."
        }
      ],
      realModelLabel: "Realny model",
      realModelNote: "Zaimportowano z `Photo/Model SOAK`",
      placeholderNote: "Podmień na finalny render lub zdjęcie modelu"
    },
    about: {
      hero: {
        eyebrow: "About",
        title: "Marka zbudowana wokół transformacji.",
        description:
          "WEIRDO powstało jako odpowiedź na statyczne instrumenty i przewidywalne sylwetki. Idea była prosta: stworzyć gitary premium z mocną tożsamością wizualną i jednocześnie zaprojektować je tak, aby mogły ewoluować razem z muzykiem."
      },
      origin: {
        eyebrow: "Geneza",
        title: "Stworzone dla muzyków, którzy nie uznają stałych form.",
        description:
          "Język WEIRDO łączy architektoniczną geometrię, głębokie wykończenia i kontrolowany bunt. Każda linia ma wyglądać świadomie, filmowo i bezsprzecznie premium."
      },
      philosophy: {
        eyebrow: "Filozofia",
        title: "Modularność nie jest dodatkiem. Jest osią projektu.",
        description:
          "Korpusy, elektronika, konfiguracje pickupów i detale wizualne zostały pomyślane tak, by można je było z czasem przeprojektowywać. Instrumenty WEIRDO nie są zamkniętymi produktami, lecz premium platformami ciągłej zmiany."
      }
    },
    gallery: {
      hero: {
        eyebrow: "Gallery",
        title: "Model SOAK w premium układzie galerii.",
        description:
          "Galeria korzysta teraz z lokalnych zdjęć jednego wybranego modelu, zachowując ciemny, edytorialowy charakter całej strony."
      },
      itemNote: "Model SOAK z lokalnego folderu `Photo`.",
      items: [
        { title: "Front modelu", src: sharedGalleryImages[0] },
        { title: "Detal korpusu", src: sharedGalleryImages[1] },
        { title: "Alternatywny front", src: sharedGalleryImages[2] },
        { title: "Makro główki", src: sharedGalleryImages[3] },
        { title: "Wariant wykończenia", src: sharedGalleryImages[4] },
        { title: "Faktura powierzchni", src: sharedGalleryImages[5] }
      ]
    },
    contact: {
      hero: {
        eyebrow: "Contact",
        title: "Zacznijmy rozmowę.",
        description:
          "Skorzystaj z formularza poniżej, jeśli chcesz porozmawiać o współpracy, prototypach, dostępności lub przyszłych projektach custom. Miejsca na social media i e-mail pozostają łatwe do podmiany."
      },
      form: {
        name: "Imię",
        email: "E-mail",
        message: "Wiadomość",
        namePlaceholder: "Twoje imię",
        emailPlaceholder: "ty@example.com",
        messagePlaceholder: "Napisz, czego szukasz, co budujesz albo co chcesz stworzyć.",
        button: "Wyślij zapytanie"
      },
      details: {
        eyebrow: "Dane kontaktowe",
        title: "Podmień te placeholdery na finalne kanały kontaktu.",
        lines: [
          "Email: hello@weirdo-guitars.com",
          "Instagram: @weirdo.guitars",
          "Miejsce na Behance / YouTube / TikTok"
        ]
      }
    },
    shop: {
      hero: {
        eyebrow: "Shop",
        title: "Konfigurator wkrótce.",
        description:
          "Sklep WEIRDO rozwinie się w modularne doświadczenie konfiguracji, gdzie wykończenie, hardware, pickupy i układ będą składane w osobisty instrument."
      },
      previewEyebrow: "Zapowiedź",
      previewTitle: "Builder produktu premium jest w przygotowaniu.",
      previewDescription:
        "Ta podstrona pełni na razie funkcję eleganckiej zapowiedzi. Gdy konfigurator będzie gotowy, sekcja może zostać rozszerzona o logikę produktu, ceny, opcje i checkout.",
      modulesTitle: "Przyszłe moduły",
      modules: [
        "Wybór kształtu korpusu",
        "Wymienne pickupy i elektronika",
        "Zestawy wykończeń i hardware",
        "Lead capture dla pierwszych dropów"
      ],
      cta: "Zapytaj o dostępność"
    }
  },
  en: {
    header: {
      leftNavItems: [
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" }
      ],
      rightNavItems: [
        { href: "/gallery", label: "Gallery" },
        { href: "/configurator", label: "Configurator" }
      ],
      languageLabel: "Language"
    },
    footer: {
      lineOne: "WEIRDO guitars. Modular design. Premium craftsmanship.",
      lineTwo: "Designed for evolution, built for stage presence."
    },
    home: {
      eyebrow: "Modular Luxury Instruments",
      title: "Designed to evolve with the artist.",
      description:
        "WEIRDO is a premium concept brand focused on bold silhouettes, precise craft and a modular platform that changes with each era of your sound.",
      primaryCta: "Explore Gallery",
      secondaryCta: "Build your guitar",
      heroModelName: "Model SOAK",
      heroModelDescription:
        "First photographed concept added directly from the local project photo folder.",
      signatureEyebrow: "Signature Concepts",
      signatureTitle: "Early models shaped for stage presence.",
      signatureNote:
        "The first card now uses a real model photo, while the remaining placeholders stay ready for quick replacement.",
      models: [
        {
          name: "Model SOAK",
          image: "/models/soak/DSC05618.JPG",
          real: true,
          description:
            "Hand-finished concept instrument with sculpted lines, dark grain and a red-black premium finish built for presence."
        },
        {
          name: "Monolith Gold",
          description:
            "Single-cut statement piece with interchangeable top plates and a voice tuned for cinematic sustain."
        },
        {
          name: "Spectra Void",
          description:
            "Progressive performance model built around quick-swap pickups, neck profiles and control layouts."
        }
      ],
      realModelLabel: "Real Model",
      realModelNote: "Imported from `Photo/Model SOAK`",
      placeholderNote: "Replace with real guitar render or photo"
    },
    about: {
      hero: {
        eyebrow: "About",
        title: "A brand built around transformation.",
        description:
          "WEIRDO began as a response to static instruments and predictable silhouettes. The idea was simple: create premium guitars with a visual identity strong enough for the stage, then engineer them to adapt as the player evolves."
      },
      origin: {
        eyebrow: "Origin",
        title: "Crafted for players who refuse fixed forms.",
        description:
          "The WEIRDO language mixes architectural geometry, deep finishes and a sense of controlled rebellion. Every line is meant to look intentional, cinematic and unmistakably premium."
      },
      philosophy: {
        eyebrow: "Philosophy",
        title: "Modularity is not an accessory. It is the core idea.",
        description:
          "Bodies, electronics, pickup configurations and visual accents are designed to be reimagined over time. WEIRDO instruments are not frozen products, but premium platforms for continuous change."
      }
    },
    gallery: {
      hero: {
        eyebrow: "Gallery",
        title: "Model SOAK in a premium gallery layout.",
        description:
          "The gallery now uses photos from the local project folder for one selected model, while the rest of the site keeps its dark editorial presentation."
      },
      itemNote: "Model SOAK from the local `Photo` directory.",
      items: [
        { title: "Front silhouette", src: sharedGalleryImages[0] },
        { title: "Body detail", src: sharedGalleryImages[1] },
        { title: "Alternative front", src: sharedGalleryImages[2] },
        { title: "Headstock macro", src: sharedGalleryImages[3] },
        { title: "Finish variation", src: sharedGalleryImages[4] },
        { title: "Surface texture", src: sharedGalleryImages[5] }
      ]
    },
    contact: {
      hero: {
        eyebrow: "Contact",
        title: "Start the conversation.",
        description:
          "Use the form below for inquiries about collaborations, prototypes, availability or future custom projects. Social and email slots are intentionally easy to replace."
      },
      form: {
        name: "Name",
        email: "Email",
        message: "Message",
        namePlaceholder: "Your name",
        emailPlaceholder: "you@example.com",
        messagePlaceholder: "Tell us what you are building, imagining or looking for.",
        button: "Send Inquiry"
      },
      details: {
        eyebrow: "Contact Details",
        title: "Replace these placeholders with final channels.",
        lines: [
          "Email: hello@weirdo-guitars.com",
          "Instagram: @weirdo.guitars",
          "Behance / YouTube / TikTok slots ready here"
        ]
      }
    },
    shop: {
      hero: {
        eyebrow: "Shop",
        title: "Configurator coming soon.",
        description:
          "The WEIRDO shop will evolve into a modular configuration experience where finish, hardware, pickups and layout can be assembled into a personal instrument."
      },
      previewEyebrow: "Preview",
      previewTitle: "A premium product builder is in development.",
      previewDescription:
        "This page currently acts as an elegant holding space. When the configurator is ready, the section can be expanded with product logic, pricing, options and checkout flow.",
      modulesTitle: "Future modules",
      modules: [
        "Body shape selection",
        "Pickup and electronics swaps",
        "Finish and hardware combinations",
        "Lead capture for first production drops"
      ],
      cta: "Ask About Availability"
    }
  }
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
