use super::*;

fn parse_index_entry(file_name: &str, content: &str) -> VaultEntry {
    let dir = TempDir::new().unwrap();
    parse_test_entry(&dir, file_name, content)
}

#[test]
fn test_parse_index_truthy_canonical_key() {
    let entry = parse_index_entry(
        "papers-index.md",
        "---\n_index: true\n---\n# Papers Index\n",
    );
    assert!(entry.is_index, "_index canonical key must parse as true");
}

#[test]
fn test_parse_index_absent_defaults_to_false() {
    let entry = parse_index_entry("note.md", "---\ntype: Note\n---\n# A Note\n");
    assert!(!entry.is_index, "absent _index must default to false");
}

#[test]
fn test_parse_index_falsy_string_values() {
    let cases = [
        ("no.md", "---\n_index: false\n---\n# No\n"),
        ("no2.md", "---\n_index: \"false\"\n---\n# No\n"),
        ("no3.md", "---\n_index: no\n---\n# No\n"),
        ("no4.md", "---\n_index: 0\n---\n# No\n"),
    ];
    for (file_name, content) in cases {
        let entry = parse_index_entry(file_name, content);
        assert!(!entry.is_index, "{file_name} must parse as false");
    }
}

#[test]
fn test_parse_index_truthy_string_values() {
    let cases = [
        ("yes.md", "---\n_index: yes\n---\n# Yes\n"),
        ("yes2.md", "---\n_index: Yes\n---\n# Yes\n"),
        ("yes3.md", "---\n_index: \"true\"\n---\n# Yes\n"),
        ("yes4.md", "---\n_index: 1\n---\n# Yes\n"),
    ];
    for (file_name, content) in cases {
        let entry = parse_index_entry(file_name, content);
        assert!(entry.is_index, "{file_name} must parse as true");
    }
}

#[test]
fn test_index_not_in_relationships_or_properties() {
    let entry = parse_index_entry("index.md", "---\n_index: true\ntype: Note\n---\n# Index\n");
    assert!(!entry.relationships.contains_key("_index"));
    assert!(!entry.properties.contains_key("_index"));
}
