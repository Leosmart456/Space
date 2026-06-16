import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Search, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  address: string;
  network: string;
}

export default function AddressBook() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock contacts - in real app, this would come from API/storage
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: "1",
      name: "John's Wallet",
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      network: "ETH",
    },
    {
      id: "2",
      name: "Sarah's BNB",
      address: "0x123456789abcdef123456789abcdef1234567890",
      network: "BNB",
    },
    {
      id: "3",
      name: "Mike's TRON",
      address: "THa5iGZk9mBq5742scd9NsvqAPiJcgt4QL",
      network: "TRX",
    },
  ]);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
    toast({
      title: "Contact deleted",
      description: "The contact has been removed from your address book.",
    });
  };

  const handleSelectContact = (contact: Contact) => {
    // Store selected address in localStorage for send page to pick up
    localStorage.setItem('selectedContactAddress', contact.address);
    toast({
      title: "Contact selected",
      description: `Address: ${contact.address}`,
    });
    // Navigate back to send page
    window.history.back();
  };

  const handleAddContact = () => {
    toast({
      title: "Coming soon",
      description: "Add contact functionality will be available in the next update.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                data-testid="button-back"
                className="hover-elevate"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-display font-semibold">Address Book</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-2xl">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-contacts"
          />
        </div>

        {/* Add Contact Button */}
        <Button
          className="w-full mb-4 gap-2"
          onClick={handleAddContact}
          data-testid="button-add-contact"
        >
          <Plus className="h-4 w-4" />
          Add New Contact
        </Button>

        {/* Contacts List */}
        <div className="space-y-2">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No contacts found</p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-lg bg-card border hover-elevate"
                data-testid={`contact-item-${contact.id}`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSelectContact(contact)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{contact.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {contact.network}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono truncate">
                    {contact.address}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 hover-elevate"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteContact(contact.id);
                  }}
                  data-testid={`button-delete-${contact.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Empty State */}
        {contacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Your address book is empty
            </p>
            <p className="text-sm text-muted-foreground">
              Add contacts to quickly send crypto to your favorite addresses
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
